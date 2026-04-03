import { css, html, LitElement, SVGTemplateResult, TemplateResult } from 'lit';
import { property, query, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { msg } from '@lit/localize';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { isPublic } from '@openscd/scl-lib';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { newEditDialogEditEvent } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';

import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import {
  dataTypeTemplateIcons,
  iconType,
  pathToSvg,
} from '@omicronenergy/oscd-ui/scl-icon/OscdSclIcon.js';

import { cleanSCLItems, identitySort, uniq } from './util.js';

type templateType = 'EnumType' | 'DAType' | 'DOType' | 'LNodeType';

const iconMapping: Record<templateType, iconType> = {
  EnumType: 'enumIcon',
  DAType: 'dAIcon',
  DOType: 'dOIcon',
  LNodeType: 'lNIcon',
};

const filterClassMapping: Record<string, string> = {
  EnumType: 'enum-type',
  DAType: 'da-type',
  DOType: 'do-type',
  LNodeType: 'lnode-type',
};

/**
 * Return a secondary description string for a data type.
 */
function getDataTypeSecondaryText(dType: Element): string | null | undefined {
  if (dType.tagName === 'LNodeType') {
    return dType.getAttribute('lnClass');
  } else if (dType.tagName === 'DAType') {
    return dType.getAttribute('desc');
  } else if (dType.tagName === 'DOType') {
    return dType.getAttribute('cdc');
  } else if (dType.tagName === 'EnumType') {
    return dType.getAttribute('desc');
  }
  return 'Unknown';
}

/** An editor component for cleaning SCL DataType templates. */
export class CleanupDataTypes extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-outlined-text-field': OscdOutlinedTextField,
    'oscd-outlined-button': OscdOutlinedButton,
    'oscd-icon-button': OscdIconButton,
    'oscd-checkbox': OscdCheckbox,
    'oscd-icon': OscdIcon,
  };

  @property({ attribute: false })
  doc!: XMLDocument;

  @property({ attribute: false })
  docVersion?: unknown;

  @property({ type: Boolean })
  disableControlClean = false;

  @property({ type: Array })
  unreferencedDataTypes: Element[] = [];

  @state()
  private selectedIndices: Set<number> = new Set();

  @state()
  private searchTerm = '';

  @state()
  private filterStates: Map<string, boolean> = new Map([
    ['LNodeType', true],
    ['DOType', true],
    ['DAType', true],
    ['EnumType', true],
  ]);

  @query('.delete-button')
  cleanButton!: OscdOutlinedButton;

  @queryAll('.cleanup-list-item')
  cleanupListItems!: NodeListOf<HTMLElement>;

  @query('.clean-sub-types-checkbox')
  cleanSubTypesCheckbox!: OscdCheckbox;

  private get filteredTypes(): Array<{ item: Element; index: number }> {
    const term = this.searchTerm.toLowerCase();
    return this.unreferencedDataTypes
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (!this.filterStates.get(item.tagName)) {
          return false;
        }
        if (!term) {
          return true;
        }
        const id = item.getAttribute('id') ?? '';
        const tagName = item.tagName;
        const secondary = getDataTypeSecondaryText(item) ?? '';
        return [id, tagName, secondary].some(s =>
          s.toLowerCase().includes(term),
        );
      });
  }

  private get isAllSelected(): boolean {
    const visible = this.filteredTypes;
    return (
      visible.length > 0 &&
      visible.every(({ index }) => this.selectedIndices.has(index))
    );
  }

  private toggleItem(index: number): void {
    const next = new Set(this.selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this.selectedIndices = next;
  }

  private toggleSelectAll(): void {
    const visible = this.filteredTypes;
    if (this.isAllSelected) {
      const next = new Set(this.selectedIndices);
      visible.forEach(({ index }) => next.delete(index));
      this.selectedIndices = next;
    } else {
      const next = new Set(this.selectedIndices);
      visible.forEach(({ index }) => next.add(index));
      this.selectedIndices = next;
    }
  }

  private toggleFilter(dataType: string): void {
    const next = new Map(this.filterStates);
    next.set(dataType, !next.get(dataType));
    this.filterStates = next;
  }

  /**
   * Render a filter icon button for the given data type.
   */
  private renderFilterIconButton(
    dataType: templateType,
    initialState = true,
  ): TemplateResult {
    const isOn = this.filterStates.get(dataType) ?? initialState;
    const icon: SVGTemplateResult = pathToSvg(iconMapping[dataType]);
    return html`
      <oscd-icon-button
        label="filter"
        class="t-${filterClassMapping[dataType]}-filter filter-toggle ${isOn
          ? 'filter-on'
          : ''}"
        @click=${() => this.toggleFilter(dataType)}
      >
        ${icon}
      </oscd-icon-button>
    `;
  }

  /**
   * Open the appropriate editor dialog for a given data type element.
   */
  private openDataTypeEditor(dType: Element, e: MouseEvent): void {
    e.stopPropagation();
    this.dispatchEvent(newEditDialogEditEvent(dType));
  }

  /**
   * Render a list item in the data type cleanup container.
   */
  private renderListItem(dType: Element, index: number): TemplateResult {
    const selected = this.selectedIndices.has(index);
    const icon = dataTypeTemplateIcons[dType.tagName];

    return html`
      <div
        class="${classMap({
          checkListItem: true,
          'cleanup-list-item': true,
          'list-item': true,
          selected,
        })}"
        role="listitem"
        tabindex="0"
        data-index="${index}"
        @click=${(e: MouseEvent) => {
          if ((e.target as Element).closest('oscd-icon-button')) {
            return;
          }
          this.toggleItem(index);
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggleItem(index);
          }
        }}
      >
        <oscd-checkbox
          ?checked=${selected}
          @click=${(e: Event) => {
            e.stopPropagation();
            this.toggleItem(index);
          }}
        ></oscd-checkbox>
        ${icon ? html`<span class="item-icon">${icon}</span>` : html``}
        <div class="item-content">
          <div class="item-primary">
            <span class="unreferenced-control"
              >${dType.getAttribute('id')!}</span
            >
            <oscd-icon-button
              label="Edit"
              class="edit-item"
              @click=${(e: MouseEvent) => this.openDataTypeEditor(dType, e)}
            >
              <oscd-icon>edit</oscd-icon>
            </oscd-icon-button>
          </div>
          <div class="item-secondary">${getDataTypeSecondaryText(dType)}</div>
        </div>
      </div>
    `;
  }

  /**
   * Given a datatype reference return the appropriate datatype object or null.
   */
  private getSubType(element: Element): Element | null {
    const dataTypeTemplates = this.doc.querySelector(
      ':root > DataTypeTemplates',
    );
    const type = element.getAttribute('type');
    if (element.tagName === 'DO' || element.tagName === 'SDO') {
      return dataTypeTemplates!.querySelector(`DOType[id="${type}"]`);
    } else if (
      (element.tagName === 'DA' || element.tagName === 'BDA') &&
      element.getAttribute('bType') === 'Struct'
    ) {
      return dataTypeTemplates!.querySelector(`DAType[id="${type}"]`);
    } else if (
      (element.tagName === 'DA' || element.tagName === 'BDA') &&
      element.getAttribute('bType') === 'Enum'
    ) {
      return dataTypeTemplates!.querySelector(`EnumType[id="${type}"]`);
    }
    return null;
  }

  /**
   * Recurses from root elements to find all child datatype references (with duplicates).
   */
  private fetchTree(rootElements: Element[]): string[] {
    const elementStack = [...rootElements];
    const traversedElements: string[] = [];

    const MAX_STACK_DEPTH = 300000;

    while (elementStack.length > 0 && elementStack.length <= MAX_STACK_DEPTH) {
      const currentElement = elementStack.pop();
      traversedElements.push(currentElement!.getAttribute('id')!);

      const selector = 'DO, SDO, DA, BDA';

      Array.from(currentElement!.querySelectorAll(selector))
        .filter(isPublic)
        .forEach(element => {
          const newElement = this.getSubType(element);
          if (newElement !== null) {
            elementStack.unshift(newElement);
          }
        });

      if (elementStack.length >= MAX_STACK_DEPTH) {
        console.error(
          `${msg('Unreferenced Data Types')}: Max Stack Length Exceeded. Maximum allowed is ${MAX_STACK_DEPTH}. Datatype cleaning incomplete and file damage may have occurred.`,
        );
      }
    }

    return traversedElements;
  }

  /**
   * Recurses through all datatype templates and indexes their usage.
   */
  private indexDataTypeTemplates(dttStart: Element[]): Map<string, number> {
    const dataTypeFrequencyUsage = new Map<string, number>();
    const allUsages = this.fetchTree(dttStart);
    allUsages.forEach(item => {
      dataTypeFrequencyUsage.set(
        item,
        (dataTypeFrequencyUsage.get(item) || 0) + 1,
      );
    });
    return dataTypeFrequencyUsage;
  }

  /**
   * Get items from selection list and any subtypes.
   */
  public getCleanItems(): Element[] {
    const cleanItems = Array.from(this.selectedIndices.values()).map(
      idx => this.unreferencedDataTypes[idx],
    );

    if (this.cleanSubTypesCheckbox?.checked === true) {
      const dataTypeTemplates = this.doc.querySelector(
        ':root > DataTypeTemplates',
      )!;

      const startingLNodeTypes = Array.from(
        dataTypeTemplates.querySelectorAll('LNodeType'),
      );
      const dataTypeUsageCounter =
        this.indexDataTypeTemplates(startingLNodeTypes);

      cleanItems.forEach(item => {
        if (item.tagName === 'LNodeType') {
          const childDataTypeTemplateIds = this.fetchTree([item]);
          childDataTypeTemplateIds.forEach(id => {
            dataTypeUsageCounter?.set(id, dataTypeUsageCounter.get(id)! - 1);
          });
        }
      });

      cleanItems.forEach(item => {
        if (['DOType', 'DAType'].includes(item.tagName)) {
          const unusedDataTypeTemplateChildrenIds = uniq(
            this.fetchTree([item]),
          );
          unusedDataTypeTemplateChildrenIds.forEach(id => {
            if (dataTypeUsageCounter.get(<string>id) === undefined) {
              cleanItems.push(dataTypeTemplates.querySelector(`[id="${id}"]`)!);
            }
          });
        }
      });

      dataTypeUsageCounter?.forEach((count, dataTypeId) => {
        if (count <= 0) {
          cleanItems.push(
            dataTypeTemplates.querySelector(`[id="${dataTypeId}"]`)!,
          );
        }
      });
    }
    return cleanItems;
  }

  /**
   * Render the delete button for the data type cleanup container.
   */
  private renderDeleteButton(): TemplateResult {
    const count = this.selectedIndices.size;
    return html`
      <oscd-outlined-button
        class="delete-button"
        ?disabled=${count === 0}
        @click=${() => {
          const dataTypeItemsDeleteActions = cleanSCLItems(
            this.getCleanItems(),
          );
          if (dataTypeItemsDeleteActions.length) {
            this.dispatchEvent(newEditEventV2(dataTypeItemsDeleteActions));
          }
          this.selectedIndices = new Set();
        }}
      >
        <oscd-icon slot="icon">delete</oscd-icon>
        ${msg('Remove Selected Data Types')} (${count || '0'})
      </oscd-outlined-button>
    `;
  }

  /**
   * Find unused types by scanning the SCL and comparing with the DataTypeTemplates.
   */
  private getUnusedType(
    usedSelector: string,
    keyAttributeName: string,
    templateSelector: string,
  ): Element[] {
    const usedTypes = uniq(
      Array.from(this.doc?.querySelectorAll(usedSelector) ?? [])
        .filter(isPublic)
        .map(uType => uType.getAttribute(keyAttributeName)),
    );

    const unreferencedTypes: Element[] = [];
    Array.from(
      this.doc?.querySelectorAll(`DataTypeTemplates > ${templateSelector}`) ??
        [],
    )
      .filter(isPublic)
      .forEach(dType => {
        if (!usedTypes.includes(dType.getAttribute('id') ?? 'Unknown')) {
          unreferencedTypes.push(dType);
        }
      });
    return identitySort(unreferencedTypes);
  }

  private getUnusedTypes(): Element[] {
    const unreferencedLNTypes = this.getUnusedType(
      'LN, LN0',
      'lnType',
      'LNodeType',
    );
    const unreferencedDOTypes = this.getUnusedType('DO, SDO', 'type', 'DOType');
    const unreferencedDATypes = this.getUnusedType(
      'DA[bType="Struct"], BDA[bType="Struct"]',
      'type',
      'DAType',
    );
    const unreferencedEnumTypes = this.getUnusedType(
      'DA[bType="Enum"], BDA[bType="Enum"]',
      'type',
      'EnumType',
    );
    return unreferencedLNTypes.concat(
      unreferencedDOTypes,
      unreferencedDATypes,
      unreferencedEnumTypes,
    );
  }

  private renderUnreferencedDataTypes(): TemplateResult {
    this.unreferencedDataTypes = this.getUnusedTypes();

    return html`
      <div class="content">
        <header>
          <h1
            title="${msg('Unreferenced Data Types')} (${this
              .unreferencedDataTypes.length})"
          >
            ${msg('Unreferenced Data Types')}
            <span class="count">(${this.unreferencedDataTypes.length})</span>
          </h1>
          <p class="subtitle">
            ${msg(
              'Data Types not referenced by any Logical Node or other Data Type',
            )}
          </p>
          <div class="filter-buttons">
            ${this.renderFilterIconButton('LNodeType')}
            ${this.renderFilterIconButton('DOType')}
            ${this.renderFilterIconButton('DAType')}
            ${this.renderFilterIconButton('EnumType')}
            <label class="option-label">
              <oscd-checkbox
                checked
                class="clean-sub-types-checkbox"
              ></oscd-checkbox>
              ${msg('Also remove subtypes')}
            </label>
          </div>
          <div class="search-row">
            <oscd-checkbox
              class="select-all-checkbox"
              title="Select all"
              ?checked=${this.isAllSelected}
              @change=${() => this.toggleSelectAll()}
            ></oscd-checkbox>
            <oscd-outlined-text-field
              class="filter-input"
              placeholder="Search"
              .value=${this.searchTerm}
              @input=${(e: InputEvent) => {
                this.searchTerm = (e.target as HTMLInputElement).value;
              }}
            >
              <oscd-icon slot="trailing-icon">search</oscd-icon>
            </oscd-outlined-text-field>
          </div>
        </header>
        <div class="cleanup-list check-list">
          ${this.filteredTypes.map(({ item, index }) =>
            this.renderListItem(item, index),
          )}
        </div>
      </div>
      <footer>${this.renderDeleteButton()}</footer>
    `;
  }

  render(): TemplateResult {
    return html`
      <section tabindex="0">${this.renderUnreferencedDataTypes()}</section>
    `;
  }

  static styles = css`
    :host(.moving) section {
      opacity: 0.3;
    }

    section {
      background-color: var(--oscd-base3);
      transition: all 200ms linear;
      outline-color: var(--oscd-primary);
      outline-style: solid;
      outline-width: 0px;
      opacity: 1;
    }

    h1,
    h2,
    h3 {
      color: var(--oscd-base00);
      font-family: var(--oscd-text-font, 'Roboto'), sans-serif;
      font-weight: 300;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin: 0;
      line-height: 36px;
      transition: background-color 150ms linear;
    }

    h1 > nav,
    h2 > nav,
    h3 > nav {
      float: right;
    }

    .subtitle {
      font-family: var(--oscd-text-font, 'Roboto'), sans-serif;
      font-size: 12px;
      font-weight: 400;
      color: var(--oscd-base0, rgba(0, 0, 0, 0.54));
      margin: 6px 0 14px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .count {
      font-size: 0.6em;
      font-weight: 400;
      opacity: 0.7;
    }

    section {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: space-between;
      min-height: 0;
      padding: 0 12px;
      box-sizing: border-box;
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 6px;
    }

    @media (max-width: 1200px) {
      footer {
        flex-direction: row;
      }

      .list-item {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    @media (min-width: 1201px) {
      header {
        display: grid;
        grid-template-rows:
          36px
          auto
          var(--cleanup-filter-row-height, 48px)
          auto;
      }
    }

    .edit-item {
      --md-icon-button-icon-size: 16px;
      visibility: hidden;
      opacity: 0;
    }

    .cleanup-list-item:hover .edit-item {
      visibility: visible;
      opacity: 1;
      transition:
        visibility 0s,
        opacity 0.5s linear;
    }

    .edit-item[disabled] {
      display: none;
    }

    .delete-button {
      float: right;
    }

    footer {
      align-items: center;
      align-content: center;
      display: flex;
      flex-flow: row wrap;
      flex-direction: row-reverse;
      justify-content: space-between;
      row-gap: 12px;
      margin: 16px;
    }

    .check-list {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      scrollbar-gutter: stable;
      scrollbar-width: thin;
      scrollbar-color: var(--oscd-base1, #667584) transparent;
    }

    .check-list::-webkit-scrollbar {
      width: 6px;
    }

    .check-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .check-list::-webkit-scrollbar-thumb {
      background-color: var(--oscd-base1, #667584);
      border-radius: 3px;
    }

    .check-list::-webkit-scrollbar-thumb:hover {
      background-color: var(--oscd-base0, #768594);
    }

    .search-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
      padding: 0 8px;
    }

    .filter-input {
      flex: 1;
      --md-outlined-text-field-container-shape: 20px;
    }

    .select-all-checkbox {
      flex-shrink: 0;
    }

    .filter-buttons {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 4px;
      margin-bottom: 10px;
    }

    .filter-toggle {
      --md-icon-button-icon-size: 26px;
      border-radius: 8px;
      border: 1px solid var(--oscd-base1, rgba(0, 0, 0, 0.2));
      opacity: 0.6;
      transition:
        background-color 150ms linear,
        border-color 150ms linear,
        opacity 150ms linear;
    }

    .filter-toggle.filter-on {
      --md-icon-button-icon-color: var(--oscd-base3);
      background-color: var(--oscd-secondary);
      border-color: var(--oscd-secondary);
      color: var(--oscd-base3);
      opacity: 1;
    }

    .list-item {
      display: flex;
      align-items: center;
      padding: 8px;
      cursor: pointer;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .list-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .list-item.selected {
      background-color: rgba(0, 0, 0, 0.08);
    }

    .item-icon {
      display: flex;
      align-items: center;
      margin: 0 4px;
      flex-shrink: 0;
    }

    .item-content {
      flex: 1;
      margin-left: 8px;
      min-width: 0;
    }

    .item-primary {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .item-secondary {
      font-size: 12px;
      font-family: var(--oscd-text-font, 'Roboto'), sans-serif;
      color: var(--oscd-base00, rgba(0, 0, 0, 0.6));
      margin-top: 2px;
    }

    .unreferenced-control {
      font-family: var(--oscd-text-font, 'Roboto'), sans-serif;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option-label {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      flex-shrink: 0;
      cursor: pointer;
      font-family: var(--oscd-text-font, 'Roboto'), sans-serif;
      font-size: 12px;
      color: var(--oscd-base0, rgba(0, 0, 0, 0.54));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
}
