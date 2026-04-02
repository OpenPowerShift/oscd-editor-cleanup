import { LitElement, TemplateResult } from 'lit';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
declare const CleanupDatasets_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/** An editor component for cleaning SCL datasets. */
export declare class CleanupDatasets extends CleanupDatasets_base {
    static scopedElements: {
        'oscd-outlined-text-field': typeof OscdOutlinedTextField;
        'oscd-outlined-button': typeof OscdOutlinedButton;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-checkbox': typeof OscdCheckbox;
        'oscd-icon': typeof OscdIcon;
    };
    /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
    doc: XMLDocument;
    docVersion?: unknown;
    unreferencedDataSets: Element[];
    private selectedIndices;
    private searchTerm;
    cleanupButton: OscdOutlinedButton;
    dataSetItems: NodeListOf<HTMLElement>;
    private get filteredDataSets();
    private get isAllSelected();
    private toggleItem;
    private toggleSelectAll;
    /**
     * Provide a list item in the DataSet cleanup container.
     * @param dataSet - an unused SCL DataSet element.
     * @param index - the data-array index.
     * @returns html for the checkable list item.
     */
    private renderListItem;
    /**
     * Render the delete button for the dataset cleanup container.
     */
    private renderDeleteButton;
    /**
     * Render the unreferenced datasets section.
     */
    private renderUnreferencedDataSets;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
