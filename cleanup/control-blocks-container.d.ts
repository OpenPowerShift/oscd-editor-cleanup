import { LitElement, TemplateResult } from 'lit';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
declare const CleanupControlBlocks_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/** An editor component for cleaning SCL Control Blocks. */
export declare class CleanupControlBlocks extends CleanupControlBlocks_base {
    static scopedElements: {
        'oscd-outlined-text-field': typeof OscdOutlinedTextField;
        'oscd-outlined-button': typeof OscdOutlinedButton;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-checkbox': typeof OscdCheckbox;
        'oscd-icon': typeof OscdIcon;
    };
    doc: XMLDocument;
    docVersion?: unknown;
    unreferencedControls: Element[];
    private selectedIndices;
    private searchTerm;
    /** Track filter toggle state per control type. ReportControl is hidden by default. */
    private filterStates;
    cleanButton: OscdOutlinedButton;
    cleanupListItems: NodeListOf<HTMLElement>;
    cleanupAddressCheckbox: OscdCheckbox;
    private get filteredControls();
    private get isAllSelected();
    private toggleItem;
    private toggleSelectAll;
    private toggleFilter;
    /**
     * Render a filter icon button for the given control type.
     */
    private renderFilterIconButton;
    /**
     * Render a list item for the control block cleanup container.
     */
    private renderListItem;
    /**
     * Render the delete button for the control block cleanup container.
     */
    private renderDeleteButton;
    private renderUnreferencedControls;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
