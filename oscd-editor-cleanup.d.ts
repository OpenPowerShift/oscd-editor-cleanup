import { LitElement, TemplateResult } from 'lit';
import OscdSclDialogs from '@omicronenergy/oscd-scl-dialogs/OscdSclDialogs.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { CleanupDatasets } from './cleanup/datasets-container.js';
import { CleanupControlBlocks } from './cleanup/control-blocks-container.js';
import { CleanupDataTypes } from './cleanup/datatypes-container.js';
declare const OscdEditorCleanup_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/** An editor plugin for cleaning SCL references and definitions. */
export default class OscdEditorCleanup extends OscdEditorCleanup_base {
    static scopedElements: {
        'cleanup-datasets': typeof CleanupDatasets;
        'cleanup-control-blocks': typeof CleanupControlBlocks;
        'cleanup-data-types': typeof CleanupDataTypes;
        'oscd-scl-dialogs': typeof OscdSclDialogs;
        'oscd-dialog': typeof OscdDialog;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-icon': typeof OscdIcon;
        'oscd-filled-button': typeof OscdFilledButton;
    };
    /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
    doc: XMLDocument;
    docName?: string;
    docVersion?: unknown;
    private helpOpen;
    private sclDialogs;
    private handleEditDialogEvent;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private openHelp;
    private static readonly DOCS_URL;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
