import { html, fixture, expect, oneEvent } from '@open-wc/testing';
import { LitElement } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { CleanupControlBlocks } from './control-blocks-container.js';
import { OscdEditDialogEvents } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';

class CleanupControlBlocksDocFixture extends ScopedElementsMixin(LitElement) {
  declare doc?: XMLDocument;
  static scopedElements = {
    'cleanup-control-blocks': CleanupControlBlocks,
  };
  static properties = { doc: { attribute: false } };
  render() {
    return html`<cleanup-control-blocks
      .doc=${this.doc}
    ></cleanup-control-blocks>`;
  }
}
customElements.define(
  'cleanup-control-blocks-doc-fixture',
  CleanupControlBlocksDocFixture,
);

describe('CleanupControlBlocks', () => {
  describe('without a doc loaded', () => {
    it('renders without errors', async () => {
      const parent = await fixture<CleanupControlBlocksDocFixture>(
        html`<cleanup-control-blocks-doc-fixture></cleanup-control-blocks-doc-fixture>`,
      );
      const element = parent.shadowRoot!.querySelector(
        'cleanup-control-blocks',
      ) as CleanupControlBlocks;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(element).to.exist;
    });
  });

  describe('with a test file loaded', () => {
    let element: CleanupControlBlocks;

    beforeEach(async () => {
      const doc = await fetch('/test/testfiles/cleanup.scd')
        .then(response => response.text())
        .then(str => new DOMParser().parseFromString(str, 'application/xml'));

      const parent = await fixture<CleanupControlBlocksDocFixture>(
        html`<cleanup-control-blocks-doc-fixture
          .doc=${doc}
        ></cleanup-control-blocks-doc-fixture>`,
      );
      element = parent.shadowRoot!.querySelector(
        'cleanup-control-blocks',
      ) as CleanupControlBlocks;
      await element.updateComplete;
    });

    it('counts unreferenced control blocks correctly', () => {
      expect(element.unreferencedControls.length).to.equal(5);
    });

    it('has the remove button disabled by default', () => {
      expect(element.cleanButton).to.have.property('disabled', true);
    });

    it('enables the remove button after selecting a visible item', async () => {
      // cleanupListItems returns visible items (ReportControl is filtered out by default)
      const firstItem = element.cleanupListItems![0] as HTMLElement;
      firstItem.click();
      await element.updateComplete;
      expect(element.cleanButton).to.have.property('disabled', false);
    });

    it('disables the remove button after selecting then deselecting an item', async () => {
      const firstItem = element.cleanupListItems![0] as HTMLElement;
      firstItem.click();
      await element.updateComplete;
      firstItem.click();
      await element.updateComplete;
      expect(element.cleanButton).to.have.property('disabled', true);
    });

    it('enables the remove button after clicking select-all', async () => {
      const checkbox = element.shadowRoot!.querySelector(
        '.select-all-checkbox',
      ) as HTMLElement;
      checkbox.click();
      await element.updateComplete;
      expect(element.cleanButton).to.have.property('disabled', false);
    });

    it('disables the remove button after clicking select-all twice', async () => {
      const checkbox = element.shadowRoot!.querySelector(
        '.select-all-checkbox',
      ) as HTMLElement;
      checkbox.click();
      await element.updateComplete;
      checkbox.click();
      await element.updateComplete;
      expect(element.cleanButton).to.have.property('disabled', true);
    });

    it('hides GSEControl items when the GSEControl filter is toggled off', async () => {
      const countBefore = element.cleanupListItems!.length;
      // GSEControl filter button has class tGSEControlFilter
      const filterBtn = element.shadowRoot!.querySelector(
        '.tGSEControlFilter',
      ) as HTMLElement;
      filterBtn.click();
      await element.updateComplete;
      // Two GSEControl items are orphaned (GCB_NP and GCB2_NP) — count drops by 2
      expect(element.cleanupListItems!.length).to.equal(countBefore - 2);
    });

    it('restores hidden items when the filter is toggled back on', async () => {
      const countBefore = element.cleanupListItems!.length;
      const filterBtn = element.shadowRoot!.querySelector(
        '.tGSEControlFilter',
      ) as HTMLElement;
      filterBtn.click();
      await element.updateComplete;
      filterBtn.click();
      await element.updateComplete;
      expect(element.cleanupListItems!.length).to.equal(countBefore);
    });

    it('shows ReportControl items when the ReportControl filter is toggled on', async () => {
      const countBefore = element.cleanupListItems!.length;
      // ReportControl is off by default — toggle it on
      const filterBtn = element.shadowRoot!.querySelector(
        '.tReportControlFilter',
      ) as HTMLElement;
      filterBtn.click();
      await element.updateComplete;
      expect(element.cleanupListItems!.length).to.be.greaterThan(countBefore);
    });

    it('filters by name when a search term is entered', async () => {
      // 'GCB_NP' is the name of an orphaned GSEControl
      (element as unknown as Record<string, unknown>)['searchTerm'] = 'GCB_NP';
      await element.updateComplete;
      expect(element.cleanupListItems!.length).to.equal(1);
    });

    it('restores the full visible list when the search term is cleared', async () => {
      const countBefore = element.cleanupListItems!.length;
      (element as unknown as Record<string, unknown>)['searchTerm'] = 'GCB_NP';
      await element.updateComplete;
      (element as unknown as Record<string, unknown>)['searchTerm'] = '';
      await element.updateComplete;
      expect(element.cleanupListItems!.length).to.equal(countBefore);
    });

    it('shows no items when the search term matches nothing', async () => {
      (element as unknown as Record<string, unknown>)['searchTerm'] =
        'NoSuchControlBlock';
      await element.updateComplete;
      expect(element.cleanupListItems!.length).to.equal(0);
    });

    it('dispatches an oscd-edit-v2 event when the delete button is clicked', async () => {
      const firstItem = element.cleanupListItems![0] as HTMLElement;
      firstItem.click();
      await element.updateComplete;

      const eventPromise = oneEvent(element, 'oscd-edit-v2');
      element.cleanButton.click();
      const event = await eventPromise;

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(event).to.exist;
    });

    it('clears the selection and disables the button after deleting', async () => {
      const firstItem = element.cleanupListItems![0] as HTMLElement;
      firstItem.click();
      await element.updateComplete;
      expect(element.cleanButton).to.have.property('disabled', false);

      element.cleanButton.click();
      await element.updateComplete;
      expect(element.cleanButton).to.have.property('disabled', true);
    });

    it('dispatches oscd-scl-dialogs-edit when the edit button is clicked', async () => {
      const editBtn = element.shadowRoot!.querySelector(
        '.editItem',
      ) as HTMLElement;
      const eventPromise = oneEvent(element, OscdEditDialogEvents.EDIT_EVENT);
      editBtn.click();
      const event = (await eventPromise) as CustomEvent;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(event.detail.element).to.be.ok;
    });
  });
});
