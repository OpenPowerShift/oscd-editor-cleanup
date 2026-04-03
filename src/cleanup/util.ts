import { identity } from '@openscd/scl-lib';
import type { Remove } from '@openscd/oscd-api';

/**
 * Build Remove edits to delete the supplied SCL elements from the document.
 * @param cleanItems - SCL elements to be removed.
 * @returns an array of Remove edits compatible with newEditEventV2.
 */
export function cleanSCLItems(cleanItems: Element[]): Remove[] {
  const actions: Remove[] = [];
  if (cleanItems) {
    cleanItems.forEach(item => {
      actions.push({ node: item });
    });
  }
  return actions;
}

/**
 * Provide frequency count of elements.
 * @param arr - An array of strings.
 * @returns a Map of string values and their frequencies.
 */
export function countBy(arr: string[]): Map<string, number> {
  return arr.reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map());
}

/**
 * Sort a list of Elements by their identity string.
 * @param elements - an array of Elements.
 * @returns a sorted list of elements.
 */
export function identitySort(elements: Element[]): Element[] {
  return elements.sort((a: Element, b: Element) => {
    const aId = identity(a);
    const bId = identity(b);
    if (aId < bId) {
      return -1;
    }
    if (aId > bId) {
      return 1;
    }
    return 0;
  });
}

/**
 * Return a deduplicated array.
 * @param arr - an array of items with possible duplicates.
 * @returns an array of items without duplicates.
 */
export function uniq(arr: unknown[]): unknown[] {
  return Array.from(new Set(arr));
}
