import { html, fixture, expect } from '@open-wc/testing';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { LitElement } from 'lit';

import OscdEditorCleanup from './oscd-editor-cleanup.js';
import { OscdEditDialogEvents } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';

class MockOscdSclDialogsEmpty extends LitElement {
  static scopedElements = {};

  // eslint-disable-next-line class-methods-use-this
  async edit(): Promise<unknown[]> {
    return [];
  }
}

class MockOscdSclDialogsWithEdits extends LitElement {
  static scopedElements = {};

  // eslint-disable-next-line class-methods-use-this
  async edit(): Promise<unknown[]> {
    return [{ node: document.createElement('div') }];
  }
}

class TestOscdEditorCleanupEmpty extends OscdEditorCleanup {
  static scopedElements = {
    ...OscdEditorCleanup.scopedElements,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'oscd-scl-dialogs': MockOscdSclDialogsEmpty as any,
  };
}
customElements.define('oscd-editor-cleanup-empty', TestOscdEditorCleanupEmpty);

class TestOscdEditorCleanupWithEdits extends OscdEditorCleanup {
  static scopedElements = {
    ...OscdEditorCleanup.scopedElements,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'oscd-scl-dialogs': MockOscdSclDialogsWithEdits as any,
  };
}
customElements.define(
  'oscd-editor-cleanup-with-edits',
  TestOscdEditorCleanupWithEdits,
);

class OscdEditorCleanupFixtureEmpty extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-editor-cleanup': TestOscdEditorCleanupEmpty,
  };

  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`<oscd-editor-cleanup></oscd-editor-cleanup>`;
  }
}
customElements.define('cleanup-fixture-empty', OscdEditorCleanupFixtureEmpty);

class OscdEditorCleanupFixtureWithEdits extends ScopedElementsMixin(
  LitElement,
) {
  static scopedElements = {
    'oscd-editor-cleanup': TestOscdEditorCleanupWithEdits,
  };

  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`<oscd-editor-cleanup></oscd-editor-cleanup>`;
  }
}
customElements.define(
  'cleanup-fixture-with-edits',
  OscdEditorCleanupFixtureWithEdits,
);

describe('OscdEditorCleanup', () => {
  let doc: Document;

  beforeEach(async () => {
    doc = await fetch('/test/testfiles/cleanup.scd')
      .then(response => response.text())
      .then(str => new DOMParser().parseFromString(str, 'application/xml'));
  });

  it('renders without a doc', async () => {
    const parent = await fixture<OscdEditorCleanupFixtureEmpty>(
      html`<cleanup-fixture-empty></cleanup-fixture-empty>`,
    );
    const element = parent.shadowRoot!.querySelector(
      'oscd-editor-cleanup',
    ) as OscdEditorCleanup;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(element).to.exist;
  });

  it('renders with a doc', async () => {
    const parent = await fixture<OscdEditorCleanupFixtureEmpty>(
      html`<cleanup-fixture-empty></cleanup-fixture-empty>`,
    );
    const element = parent.shadowRoot!.querySelector(
      'oscd-editor-cleanup',
    ) as OscdEditorCleanup;
    element.doc = doc;
    await element.updateComplete;
    expect(element.doc).to.equal(doc);
  });

  it('renders three child cleanup components', async () => {
    const parent = await fixture<OscdEditorCleanupFixtureEmpty>(
      html`<cleanup-fixture-empty></cleanup-fixture-empty>`,
    );
    const element = parent.shadowRoot!.querySelector(
      'oscd-editor-cleanup',
    ) as OscdEditorCleanup;
    element.doc = doc;
    await element.updateComplete;

    const cleanup = element.shadowRoot!.querySelector('.cleanup')!;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(cleanup.querySelector('cleanup-datasets')).to.exist;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(cleanup.querySelector('cleanup-control-blocks')).to.exist;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(cleanup.querySelector('cleanup-data-types')).to.exist;
  });

  it('does not dispatch oscd-edit-v2 when OscdEditDialogEvents.EDIT_EVENT fires with empty edits', async () => {
    const parent = await fixture<OscdEditorCleanupFixtureEmpty>(
      html`<cleanup-fixture-empty></cleanup-fixture-empty>`,
    );
    const element = parent.shadowRoot!.querySelector(
      'oscd-editor-cleanup',
    ) as OscdEditorCleanup;
    element.doc = doc;
    await element.updateComplete;

    let dispatchCount = 0;
    element.addEventListener('oscd-edit-v2', () => {
      dispatchCount++;
    });

    element.dispatchEvent(
      new CustomEvent(OscdEditDialogEvents.EDIT_EVENT, {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );

    await element.updateComplete;

    expect(dispatchCount).to.equal(0);
  });

  it('dispatches oscd-edit-v2 when OscdEditDialogEvents.EDIT_EVENT fires with edits', async () => {
    const parent = await fixture<OscdEditorCleanupFixtureWithEdits>(
      html`<cleanup-fixture-with-edits></cleanup-fixture-with-edits>`,
    );
    const element = parent.shadowRoot!.querySelector(
      'oscd-editor-cleanup',
    ) as OscdEditorCleanup;
    element.doc = doc;
    await element.updateComplete;

    let dispatchCount = 0;
    element.addEventListener('oscd-edit-v2', () => {
      dispatchCount++;
    });

    element.dispatchEvent(
      new CustomEvent(OscdEditDialogEvents.EDIT_EVENT, {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );

    await element.updateComplete;

    expect(dispatchCount).to.equal(1);
  });
});
