import { css, html, LitElement, TemplateResult } from 'lit';
import { property, query, queryAll, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { identity, isPublic } from '@openscd/scl-lib';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { newEditDialogEditEvent } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';

import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';

import { cleanSCLItems, identitySort } from './util.js';

/** An editor component for cleaning SCL datasets. */
export class CleanupDatasets extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-outlined-text-field': OscdOutlinedTextField,
    'oscd-outlined-button': OscdOutlinedButton,
    'oscd-icon-button': OscdIconButton,
    'oscd-checkbox': OscdCheckbox,
    'oscd-icon': OscdIcon,
  };

  /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
  @property({ attribute: false })
  doc!: XMLDocument;

  @property({ attribute: false })
  docVersion?: unknown;

  @property({ type: Array })
  unreferencedDataSets: Element[] = [];

  @state()
  private selectedIndices: Set<number> = new Set();

  @state()
  private searchTerm = '';

  @query('.deleteButton')
  cleanupButton!: OscdOutlinedButton;

  @queryAll('.checkListItem')
  dataSetItems!: NodeListOf<HTMLElement>;

  private get filteredDataSets(): Array<{ item: Element; index: number }> {
    const term = this.searchTerm.toLowerCase();
    return this.unreferencedDataSets
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (!term) {
          return true;
        }
        const name = item.getAttribute('name') ?? '';
        const id = String(identity(item));
        const ied = item.closest('IED');
        const iedName = ied?.getAttribute('name') ?? '';
        const manufacturer =
          ied?.getAttribute('manufacturer') ?? 'No manufacturer defined';
        const type = ied?.getAttribute('type') ?? 'No Type Defined';
        return [name, id, iedName, manufacturer, type].some(s =>
          s.toLowerCase().includes(term),
        );
      });
  }

  private get isAllSelected(): boolean {
    const visible = this.filteredDataSets;
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
    const visible = this.filteredDataSets;
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

  /**
   * Provide a list item in the DataSet cleanup container.
   * @param dataSet - an unused SCL DataSet element.
   * @param index - the data-array index.
   * @returns html for the checkable list item.
   */
  private renderListItem(dataSet: Element, index: number): TemplateResult {
    const selected = this.selectedIndices.has(index);
    return html`
      <div
        class="checkListItem list-item ${selected ? 'selected' : ''}"
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
        <div class="item-content">
          <div class="item-primary">
            <span class="unreferencedDataSet"
              >${dataSet.getAttribute('name')!}</span
            >
            <oscd-icon-button
              label="Edit"
              class="editUnreferencedDataSet editItem"
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                (e.target as Element).dispatchEvent(
                  newEditDialogEditEvent(dataSet),
                );
              }}
            >
              <oscd-icon>edit</oscd-icon>
            </oscd-icon-button>
          </div>
          <div class="item-secondary">
            ${dataSet.closest('IED')?.getAttribute('name')}
            (${dataSet.closest('IED')?.getAttribute('manufacturer') ??
            'No manufacturer defined'})
            -
            ${dataSet.closest('IED')?.getAttribute('type') ?? 'No Type Defined'}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the delete button for the dataset cleanup container.
   */
  private renderDeleteButton(): TemplateResult {
    const count = this.selectedIndices.size;
    return html`
      <oscd-outlined-button
        class="deleteButton cleanupDeleteButton"
        ?disabled=${count === 0}
        @click=${(e: MouseEvent) => {
          const cleanItems = Array.from(this.selectedIndices.values()).map(
            idx => this.unreferencedDataSets[idx],
          );
          const deleteActions = cleanSCLItems(cleanItems);
          if (deleteActions.length) {
            (e.target as Element).dispatchEvent(newEditEventV2(deleteActions));
          }
          this.selectedIndices = new Set();
        }}
      >
        <oscd-icon slot="icon">delete</oscd-icon>
        ${msg('Remove Selected Datasets')} (${count || '0'})
      </oscd-outlined-button>
    `;
  }

  /**
   * Render the unreferenced datasets section.
   */
  private renderUnreferencedDataSets(): TemplateResult {
    const unreferencedDataSets: Element[] = [];
    Array.from(this.doc?.querySelectorAll('DataSet') ?? [])
      .filter(isPublic)
      .forEach(dataSet => {
        const parent = dataSet.parentElement;
        const name = dataSet.getAttribute('name');
        const isReferenced = Array.from(
          parent?.querySelectorAll(
            'GSEControl, ReportControl, SampledValueControl, LogControl',
          ) ?? [],
        ).some(cb => cb.getAttribute('datSet') === name);

        if (parent && (!name || !isReferenced)) {
          unreferencedDataSets.push(dataSet);
        }
      });
    this.unreferencedDataSets = identitySort(unreferencedDataSets);

    return html`
      <div class="content">
        <header>
          <h1
            title="${msg(
              'Unreferenced Datasets',
            )} (${unreferencedDataSets.length})"
          >
            ${msg('Unreferenced Datasets')}
            <span class="count">(${unreferencedDataSets.length})</span>
          </h1>
          <p class="subtitle">
            ${msg('Datasets not referenced by any control block')}
          </p>
          <div
            class="filter-buttons filter-placeholder"
            aria-hidden="true"
          ></div>
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
        <div class="dataSetList check-list">
          ${this.filteredDataSets.map(({ item, index }) =>
            this.renderListItem(item, index),
          )}
        </div>
      </div>
      <footer>${this.renderDeleteButton()}</footer>
    `;
  }

  render(): TemplateResult {
    return html`
      <section tabindex="0">${this.renderUnreferencedDataSets()}</section>
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
      flex: 1;
      display: flex;
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

    .editItem {
      --md-icon-button-icon-size: 16px;
    }

    .editItem {
      visibility: hidden;
      opacity: 0;
    }

    .checkListItem:hover .editItem {
      visibility: visible;
      opacity: 1;
      transition:
        visibility 0s,
        opacity 0.5s linear;
    }

    .cleanupDeleteButton {
      float: right;
    }

    footer {
      margin: 16px;
      display: flex;
      flex-flow: row wrap;
      flex-direction: row-reverse;
      justify-content: space-between;
      align-items: center;
      align-content: center;
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

    .filter-placeholder {
      pointer-events: none;
      min-height: 40px;
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

    .unreferencedDataSet {
      font-family: var(--oscd-text-font, 'Roboto'), sans-serif;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
}
