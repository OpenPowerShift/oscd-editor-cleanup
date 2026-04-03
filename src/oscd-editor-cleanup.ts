import { css, html, LitElement, TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import OscdSclDialogs from '@omicronenergy/oscd-scl-dialogs/OscdSclDialogs.js';
import type { EditWizard } from '@omicronenergy/oscd-scl-dialogs/OscdSclDialogs.js';
import { OscdEditDialogEvents } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';

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
    'oscd-dialog': OscdDialog,
    'oscd-icon-button': OscdIconButton,
    'oscd-icon': OscdIcon,
    'oscd-filled-button': OscdFilledButton,
  };

  /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
  @property({ attribute: false })
  doc!: XMLDocument;

  @property({ attribute: false })
  docName?: string;

  @property({ attribute: false })
  docVersion?: unknown;

  @state()
  private helpOpen = false;

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

  private static readonly DOCS_URL =
    'docs/oscd-editor-cleanup/dev/introduction.html';

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

      <oscd-icon-button
        class="help-button"
        label="Help"
        @click=${() => {
          this.helpOpen = true;
        }}
      >
        <oscd-icon>help_outline</oscd-icon>
      </oscd-icon-button>

      <oscd-dialog
        class="help-dialog"
        ?open=${this.helpOpen}
        @close=${() => {
          this.helpOpen = false;
        }}
      >
        <div slot="headline">Help</div>
        <div slot="content" class="help-content">
          <iframe
            src=${OscdEditorCleanup.DOCS_URL}
            title="OpenSCD Cleanup Plugin Documentation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          ></iframe>
        </div>
        <div slot="actions">
          <oscd-filled-button
            @click=${() => {
              this.helpOpen = false;
            }}
          >
            Close
          </oscd-filled-button>
        </div>
      </oscd-dialog>
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

    .help-button {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 100;
      --md-icon-button-icon-size: 20px;
      --md-icon-button-container-size: 32px;
      color: var(--oscd-base0, rgba(0, 0, 0, 0.54));
    }

    .help-dialog {
      width: 100%;
      height: 100%;
      max-width: 90vw !important;
      max-height: 90vh !important;
    }

    .help-content {
      width: 100%;
      height: calc(90vh - 80px);
      box-sizing: border-box;
    }

    .help-content iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }

    @media (max-width: 799px) {
      cleanup-datasets,
      cleanup-control-blocks,
      cleanup-data-types {
        flex: 1 1 100%;
        height: auto;
        min-height: 480px;
      }

      .help-dialog {
        max-width: 100vw !important;
        max-height: 90vh !important;
      }

      .help-content {
        height: calc(90vh - 80px);
      }
    }
  `;
}
