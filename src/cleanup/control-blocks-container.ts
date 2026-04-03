import { css, html, LitElement, SVGTemplateResult, TemplateResult } from 'lit';
import { property, query, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { msg } from '@lit/localize';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { identity, isPublic, controlBlockGseOrSmv } from '@openscd/scl-lib';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { newEditDialogEditEvent } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';

import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import {
  iconType,
  pathToSvg,
  SCL_ICONS,
} from '@omicronenergy/oscd-ui/scl-icon/OscdSclIcon.js';

import { cleanSCLItems, identitySort } from './util.js';

/** Maps SCL control block tag names to their SCL icon SVGTemplateResult. */
const controlBlockIcons: Partial<Record<string, SVGTemplateResult>> = {
  GSEControl: SCL_ICONS.gooseIcon,
  LogControl: SCL_ICONS.logIcon,
  SampledValueControl: SCL_ICONS.smvIcon,
  ReportControl: SCL_ICONS.reportIcon,
};

type controlType =
  | 'GSEControl'
  | 'LogControl'
  | 'SampledValueControl'
  | 'ReportControl';

const iconMapping: Record<controlType, iconType> = {
  GSEControl: 'gooseIcon',
  LogControl: 'logIcon',
  SampledValueControl: 'smvIcon',
  ReportControl: 'reportIcon',
};

/**
 * Check whether a control block is instantiated in the Communication section.
 */
function getCommAddress(controlBlock: Element): Element | null {
  return controlBlockGseOrSmv(controlBlock);
}

/** An editor component for cleaning SCL Control Blocks. */
export class CleanupControlBlocks extends ScopedElementsMixin(LitElement) {
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

  @property({ type: Array })
  unreferencedControls: Element[] = [];

  @state()
  private selectedIndices: Set<number> = new Set();

  @state()
  private searchTerm = '';

  /** Track filter toggle state per control type. ReportControl is hidden by default. */
  @state()
  private filterStates: Map<string, boolean> = new Map([
    ['GSEControl', true],
    ['LogControl', true],
    ['SampledValueControl', true],
    ['ReportControl', false],
  ]);

  @query('.deleteButton')
  cleanButton!: OscdOutlinedButton;

  @queryAll('.cleanupListItem')
  cleanupListItems!: NodeListOf<HTMLElement>;

  @query('.cleanupAddressCheckbox')
  cleanupAddressCheckbox!: OscdCheckbox;

  private get filteredControls(): Array<{ item: Element; index: number }> {
    const term = this.searchTerm.toLowerCase();
    return this.unreferencedControls
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (!this.filterStates.get(item.tagName)) {
          return false;
        }
        if (!term) {
          return true;
        }
        const name = item.getAttribute('name') ?? '';
        const id = String(identity(item));
        const tagName = item.tagName;
        const ied = item.closest('IED');
        const iedName = ied?.getAttribute('name') ?? '';
        const manufacturer =
          ied?.getAttribute('manufacturer') ?? 'No manufacturer defined';
        const type = ied?.getAttribute('type') ?? 'No Type Defined';
        return [name, id, tagName, iedName, manufacturer, type].some(s =>
          s.toLowerCase().includes(term),
        );
      });
  }

  private get isAllSelected(): boolean {
    const visible = this.filteredControls;
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
    const visible = this.filteredControls;
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

  private toggleFilter(controlType: string): void {
    const next = new Map(this.filterStates);
    next.set(controlType, !next.get(controlType));
    this.filterStates = next;
  }

  /**
   * Render a filter icon button for the given control type.
   */
  private renderFilterIconButton(
    controlType: controlType,
    initialState = true,
  ): TemplateResult {
    const isOn = this.filterStates.get(controlType) ?? initialState;
    const icon: SVGTemplateResult = pathToSvg(iconMapping[controlType]);
    return html`
      <oscd-icon-button
        label="filter"
        class="t${controlType}Filter filter-toggle ${isOn ? 'filter-on' : ''}"
        @click=${(e: MouseEvent) => {
          e.stopPropagation();
          this.toggleFilter(controlType);
        }}
      >
        ${icon}
      </oscd-icon-button>
    `;
  }

  /**
   * Render a list item for the control block cleanup container.
   */
  private renderListItem(controlBlock: Element, index: number): TemplateResult {
    const selected = this.selectedIndices.has(index);
    const hasCommAddress = getCommAddress(controlBlock) !== null;
    const icon = controlBlockIcons[controlBlock.tagName];

    return html`
      <div
        class="${classMap({
          checkListItem: true,
          cleanupListItem: true,
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
            <span class="unreferencedControl"
              >${controlBlock.getAttribute('name')!}</span
            >
            <oscd-icon-button
              label="warning"
              class="cautionItem"
              title="${msg(
                'An address definition exists for this control block in the Communication section',
              )}"
              ?disabled=${!hasCommAddress}
            >
              <oscd-icon>warning_amber</oscd-icon>
            </oscd-icon-button>
            <oscd-icon-button
              label="Edit"
              class="editItem"
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                (e.target as Element).dispatchEvent(
                  newEditDialogEditEvent(controlBlock),
                );
              }}
            >
              <oscd-icon>edit</oscd-icon>
            </oscd-icon-button>
          </div>
          <div class="item-secondary">
            ${controlBlock.tagName} -
            ${controlBlock.closest('IED')?.getAttribute('name')}
            (${controlBlock.closest('IED')?.getAttribute('manufacturer') ??
            'No manufacturer defined'})
            -
            ${controlBlock.closest('IED')?.getAttribute('type') ??
            'No Type Defined'}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the delete button for the control block cleanup container.
   */
  private renderDeleteButton(): TemplateResult {
    const count = this.selectedIndices.size;
    return html`
      <oscd-outlined-button
        class="deleteButton"
        ?disabled=${count === 0}
        @click=${(_e: MouseEvent) => {
          const cleanItems = Array.from(this.selectedIndices.values()).map(
            idx => this.unreferencedControls[idx],
          );
          const deleteEdits = cleanSCLItems(cleanItems);
          let addrEdits = deleteEdits;
          if (this.cleanupAddressCheckbox?.checked === true) {
            const addrItems = cleanSCLItems(
              cleanItems
                .map(cb => getCommAddress(cb)!)
                .filter((el): el is Element => !!el),
            );
            addrEdits = [...deleteEdits, ...addrItems];
          }
          if (addrEdits.length) {
            this.dispatchEvent(newEditEventV2(addrEdits));
          }
          this.selectedIndices = new Set();
        }}
      >
        <oscd-icon slot="icon">delete</oscd-icon>
        ${msg('Remove Selected Control Blocks')} (${count || '0'})
      </oscd-outlined-button>
    `;
  }

  private renderUnreferencedControls(): TemplateResult {
    const unreferencedCBs: Element[] = [];
    Array.from(
      this.doc?.querySelectorAll(
        'GSEControl, ReportControl, SampledValueControl, LogControl',
      ) ?? [],
    )
      .filter(isPublic)
      .forEach(cb => {
        const parent = cb.parentElement;
        const name = cb.getAttribute('datSet');
        const isReferenced = parent?.querySelector(`DataSet[name="${name}"]`);
        if (parent && (!name || !isReferenced)) {
          unreferencedCBs.push(cb);
        }
      });
    this.unreferencedControls = identitySort(unreferencedCBs);

    return html`
      <div class="content">
        <header>
          <h1
            title="${msg(
              'Orphaned Control Blocks',
            )} (${unreferencedCBs.length})"
          >
            ${msg('Orphaned Control Blocks')}
            <span class="count">(${unreferencedCBs.length})</span>
          </h1>
          <p class="subtitle">
            ${msg(
              'Control blocks without a DataSet reference - normal in ICD files and for dynamic reports.',
            )}
          </p>
          <div class="filter-buttons">
            ${this.renderFilterIconButton('LogControl')}
            ${this.renderFilterIconButton('ReportControl', false)}
            ${this.renderFilterIconButton('GSEControl')}
            ${this.renderFilterIconButton('SampledValueControl')}
            <label class="option-label">
              <oscd-checkbox
                class="cleanupAddressCheckbox"
                checked
              ></oscd-checkbox>
              ${msg('Also remove SMV/GSE Address')}
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
        <div class="cleanupList check-list">
          ${this.filteredControls.map(({ item, index }) =>
            this.renderListItem(item, index),
          )}
        </div>
      </div>
      <footer>${this.renderDeleteButton()}</footer>
    `;
  }

  render(): TemplateResult {
    return html`
      <section tabindex="0">${this.renderUnreferencedControls()}</section>
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

    .editItem,
    .cautionItem {
      --md-icon-button-icon-size: 16px;
    }

    .editItem {
      visibility: hidden;
      opacity: 0;
    }

    .cleanupListItem:hover .editItem {
      visibility: visible;
      opacity: 1;
      transition:
        visibility 0s,
        opacity 0.5s linear;
    }

    .cautionItem {
      --md-icon-button-icon-color: var(--oscd-warning, #ed6c02);
    }

    .cautionItem[disabled],
    .editItem[disabled] {
      display: none;
    }

    .deleteButton {
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .unreferencedControl {
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
