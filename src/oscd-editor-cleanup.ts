import { css, html, LitElement, TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import OscdSclDialogs from '@omicronenergy/oscd-scl-dialogs/OscdSclDialogs.js';
import type { EditWizard } from '@omicronenergy/oscd-scl-dialogs/OscdSclDialogs.js';
import { OscdEditDialogEvents } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

import { CleanupDatasets } from './cleanup/datasets-container.js';
import { CleanupControlBlocks } from './cleanup/control-blocks-container.js';
import { CleanupDataTypes } from './cleanup/datatypes-container.js';

/** An editor plugin for cleaning SCL references and definitions. */
export default class OscdEditorCleanup extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'cleanup-datasets': CleanupDatasets,
    'cleanup-control-blocks': CleanupControlBlocks,
    'cleanup-data-types': CleanupDataTypes,
    'oscd-scl-dialogs': OscdSclDialogs,
  };

  /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
  @property({ attribute: false })
  doc!: XMLDocument;

  @property({ attribute: false })
  docName?: string;

  @property({ attribute: false })
  docVersion?: unknown;

  @query('oscd-scl-dialogs')
  private sclDialogs!: OscdSclDialogs;

  private handleEditDialogEvent = async (event: Event): Promise<void> => {
    event.stopPropagation();
    const detail = (event as CustomEvent<EditWizard>).detail;
    const edits = await this.sclDialogs.edit(detail);
    if (edits.length > 0) {
      this.dispatchEvent(newEditEventV2(edits));
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener(
      OscdEditDialogEvents.EDIT_EVENT,
      this.handleEditDialogEvent,
    );
  }

  override disconnectedCallback(): void {
    this.removeEventListener(
      OscdEditDialogEvents.EDIT_EVENT,
      this.handleEditDialogEvent,
    );
    super.disconnectedCallback();
  }

  render(): TemplateResult {
    return html`
      <div class="cleanup">
        <cleanup-datasets
          .docVersion=${this.docVersion}
          .doc=${this.doc}
        ></cleanup-datasets>
        <cleanup-control-blocks
          .docVersion=${this.docVersion}
          .doc=${this.doc}
        ></cleanup-control-blocks>
        <cleanup-data-types
          .docVersion=${this.docVersion}
          .doc=${this.doc}
        ></cleanup-data-types>
      </div>
      <oscd-scl-dialogs></oscd-scl-dialogs>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      color: var(--oscd-base00);
    }

    .cleanup {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      align-content: flex-start;
      gap: 20px;
      padding: 20px;
      min-height: 0;
      height: auto;
      max-height: 100%;
      overflow-y: auto;
      --cleanup-filter-row-height: 48px;
      scrollbar-gutter: stable;
      scrollbar-width: thin;
      scrollbar-color: var(--oscd-base1, #667584) transparent;
    }

    cleanup-datasets,
    cleanup-control-blocks,
    cleanup-data-types {
      display: flex;
      flex: 1 1 320px;
      flex-direction: column;
      height: 100%;
      min-width: 0;
      overflow: hidden;
    }

    @media (max-width: 799px) {
      cleanup-datasets,
      cleanup-control-blocks,
      cleanup-data-types {
        flex: 1 1 100%;
        height: auto;
        min-height: 480px;
      }
    }
  `;
}
