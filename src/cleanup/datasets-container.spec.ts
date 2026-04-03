import { html, fixture, expect, oneEvent } from '@open-wc/testing';
import { LitElement } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { CleanupDatasets } from './datasets-container.js';
import { OscdEditDialogEvents } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';

// Register the component under test inside a scoped fixture wrapper.
class CleanupDatasetsFixture extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'cleanup-datasets': CleanupDatasets,
  };

  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`<cleanup-datasets></cleanup-datasets>`;
  }
}
customElements.define('cleanup-datasets-fixture', CleanupDatasetsFixture);

class CleanupDatasetsDocFixture extends ScopedElementsMixin(LitElement) {
  declare doc?: XMLDocument;
  static scopedElements = {
    'cleanup-datasets': CleanupDatasets,
  };
  static properties = { doc: { attribute: false } };
  render() {
    return html`<cleanup-datasets .doc=${this.doc}></cleanup-datasets>`;
  }
}
customElements.define(
  'cleanup-datasets-doc-fixture',
  CleanupDatasetsDocFixture,
);

describe('CleanupDatasets', () => {
  describe('without a doc loaded', () => {
    it('renders without errors', async () => {
      const parent = await fixture<CleanupDatasetsFixture>(
        html`<cleanup-datasets-fixture></cleanup-datasets-fixture>`,
      );
      const element = parent.shadowRoot!.querySelector(
        'cleanup-datasets',
      ) as CleanupDatasets;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(element).to.exist;
    });
  });

  describe('with a test file loaded', () => {
    let element: CleanupDatasets;

    beforeEach(async () => {
      const doc = await fetch('/test/testfiles/cleanup.scd')
        .then(response => response.text())
        .then(str => new DOMParser().parseFromString(str, 'application/xml'));

      const parent = await fixture<CleanupDatasetsDocFixture>(
        html`<cleanup-datasets-doc-fixture
          .doc=${doc}
        ></cleanup-datasets-doc-fixture>`,
      );
      element = parent.shadowRoot!.querySelector(
        'cleanup-datasets',
      ) as CleanupDatasets;
      await element.updateComplete;
    });

    it('creates correct number of list items for the expected unreferenced datasets', () => {
      expect(element.unreferencedDataSets.length).to.equal(2);
    });

    it('has the remove button disabled by default', () => {
      expect(element.cleanupButton).to.have.property('disabled', true);
    });

    it('has the remove button enabled after selecting an item', async () => {
      const firstItem = element.dataSetItems![0] as HTMLElement;
      firstItem.click();
      await element.updateComplete;
      expect(element.cleanupButton).to.have.property('disabled', false);
    });

    it('after selecting and deselecting an item the remove button is disabled again', async () => {
      const firstItem = element.dataSetItems![0] as HTMLElement;
      firstItem.click();
      await element.updateComplete;
      firstItem.click();
      await element.updateComplete;
      expect(element.cleanupButton).to.have.property('disabled', true);
    });

    it('after clicking select-all the remove button is not disabled', async () => {
      const checkbox = element.shadowRoot!.querySelector(
        '.select-all-checkbox',
      ) as HTMLElement;
      checkbox.click();
      await element.updateComplete;
      expect(element.cleanupButton).to.have.property('disabled', false);
    });

    it('after clicking select-all twice the remove button is disabled again', async () => {
      const checkbox = element.shadowRoot!.querySelector(
        '.select-all-checkbox',
      ) as HTMLElement;
      checkbox.click();
      await element.updateComplete;
      checkbox.click();
      await element.updateComplete;
      expect(element.cleanupButton).to.have.property('disabled', true);
    });

    it('filters the list when a search term is entered', async () => {
      // 'GooseDataSet2' is the name of one of the two unreferenced datasets
      (element as unknown as Record<string, unknown>)['searchTerm'] =
        'GooseDataSet2';
      await element.updateComplete;
      expect(element.dataSetItems!.length).to.equal(1);
    });

    it('restores the full list when the search term is cleared', async () => {
      (element as unknown as Record<string, unknown>)['searchTerm'] =
        'GooseDataSet2';
      await element.updateComplete;
      (element as unknown as Record<string, unknown>)['searchTerm'] = '';
      await element.updateComplete;
      expect(element.dataSetItems!.length).to.equal(2);
    });

    it('shows no items when the search term matches nothing', async () => {
      (element as unknown as Record<string, unknown>)['searchTerm'] =
        'NoSuchDataSet';
      await element.updateComplete;
      expect(element.dataSetItems!.length).to.equal(0);
    });

    it('select-all only selects filtered items when a search term is active', async () => {
      (element as unknown as Record<string, unknown>)['searchTerm'] =
        'GooseDataSet2';
      await element.updateComplete;
      const checkbox = element.shadowRoot!.querySelector(
        '.select-all-checkbox',
      ) as HTMLElement;
      checkbox.click();
      await element.updateComplete;
      // Only 1 item visible, so only 1 selected
      expect(element.cleanupButton).to.have.property('disabled', false);
      // Clear filter — the other item should not be selected
      (element as unknown as Record<string, unknown>)['searchTerm'] = '';
      await element.updateComplete;
      expect(element.dataSetItems!.length).to.equal(2);
      // Button still enabled since one item remains selected
      expect(element.cleanupButton).to.have.property('disabled', false);
    });

    it('dispatches an oscd-edit-v2 event when the delete button is clicked', async () => {
      const firstItem = element.dataSetItems![0] as HTMLElement;
      firstItem.click();
      await element.updateComplete;

      const eventPromise = oneEvent(element, 'oscd-edit-v2');
      element.cleanupButton.click();
      const event = await eventPromise;

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(event).to.exist;
    });

    it('clears the selection and disables the button after deleting', async () => {
      const firstItem = element.dataSetItems![0] as HTMLElement;
      firstItem.click();
      await element.updateComplete;
      expect(element.cleanupButton).to.have.property('disabled', false);

      element.cleanupButton.click();
      await element.updateComplete;
      expect(element.cleanupButton).to.have.property('disabled', true);
    });

    it('dispatches oscd-scl-dialogs-edit when the edit button is clicked', async () => {
      const editBtn = element.shadowRoot!.querySelector(
        '.editUnreferencedDataSet',
      ) as HTMLElement;
      const eventPromise = oneEvent(element, OscdEditDialogEvents.EDIT_EVENT);
      editBtn.click();
      const event = (await eventPromise) as CustomEvent;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(event.detail.element).to.be.ok;
    });
  });
});
