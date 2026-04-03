import type { Remove } from '@openscd/oscd-api';
/**
 * Build Remove edits to delete the supplied SCL elements from the document.
 * @param cleanItems - SCL elements to be removed.
 * @returns an array of Remove edits compatible with newEditEventV2.
 */
export declare function cleanSCLItems(cleanItems: Element[]): Remove[];
/**
 * Provide frequency count of elements.
 * @param arr - An array of strings.
 * @returns a Map of string values and their frequencies.
 */
export declare function countBy(arr: string[]): Map<string, number>;
/**
 * Sort a list of Elements by their identity string.
 * @param elements - an array of Elements.
 * @returns a sorted list of elements.
 */
export declare function identitySort(elements: Element[]): Element[];
/**
 * Return a deduplicated array.
 * @param arr - an array of items with possible duplicates.
 * @returns an array of items without duplicates.
 */
export declare function uniq(arr: unknown[]): unknown[];
