import { LitElement, TemplateResult } from 'lit';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
declare const CleanupDataTypes_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/** An editor component for cleaning SCL DataType templates. */
export declare class CleanupDataTypes extends CleanupDataTypes_base {
    static scopedElements: {
        'oscd-outlined-text-field': typeof OscdOutlinedTextField;
        'oscd-outlined-button': typeof OscdOutlinedButton;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-checkbox': typeof OscdCheckbox;
        'oscd-icon': typeof OscdIcon;
    };
    doc: XMLDocument;
    docVersion?: unknown;
    disableControlClean: boolean;
    unreferencedDataTypes: Element[];
    private selectedIndices;
    private searchTerm;
    private filterStates;
    cleanButton: OscdOutlinedButton;
    cleanupListItems: NodeListOf<HTMLElement>;
    cleanSubTypesCheckbox: OscdCheckbox;
    private get filteredTypes();
    private get isAllSelected();
    private toggleItem;
    private toggleSelectAll;
    private toggleFilter;
    /**
     * Render a filter icon button for the given data type.
     */
    private renderFilterIconButton;
    /**
     * Open the appropriate editor dialog for a given data type element.
     */
    private openDataTypeEditor;
    /**
     * Render a list item in the data type cleanup container.
     */
    private renderListItem;
    /**
     * Given a datatype reference return the appropriate datatype object or null.
     */
    private getSubType;
    /**
     * Recurses from root elements to find all child datatype references (with duplicates).
     */
    private fetchTree;
    /**
     * Recurses through all datatype templates and indexes their usage.
     */
    private indexDataTypeTemplates;
    /**
     * Get items from selection list and any subtypes.
     */
    getCleanItems(): Element[];
    /**
     * Render the delete button for the data type cleanup container.
     */
    private renderDeleteButton;
    /**
     * Find unused types by scanning the SCL and comparing with the DataTypeTemplates.
     */
    private getUnusedType;
    private getUnusedTypes;
    private renderUnreferencedDataTypes;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
