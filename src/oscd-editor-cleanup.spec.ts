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

  describe('container layout', () => {
    it('each container stretches to full height on desktop so the footer button reaches the bottom', async () => {
      const parent = await fixture<OscdEditorCleanupFixtureEmpty>(
        html`<cleanup-fixture-empty
          style="display:flex;width:1200px;height:800px;"
        ></cleanup-fixture-empty>`,
      );
      const element = parent.shadowRoot!.querySelector(
        'oscd-editor-cleanup',
      ) as OscdEditorCleanup;
      element.doc = doc;
      await element.updateComplete;

      const cleanup = element.shadowRoot!.querySelector(
        '.cleanup',
      ) as HTMLElement;
      const dataset = cleanup.querySelector('cleanup-datasets') as HTMLElement;

      // The container must fill the available height — not just wrap its content.
      // If height collapses to content, justify-content:space-between on the
      // inner section has no room to push the footer down.
      expect(dataset.offsetHeight).to.be.greaterThan(0);
      expect(dataset.offsetHeight).to.equal(cleanup.offsetHeight);
    });

    it('all three containers are always visible at intermediate widths', async () => {
      // Regression: at widths between ~800px and ~1040px, flex-wrap:wrap would
      // place the third container on a second row which overflow:hidden then clips.
      const parent = await fixture<OscdEditorCleanupFixtureEmpty>(
        html`<cleanup-fixture-empty
          style="display:flex;width:900px;height:800px;"
        ></cleanup-fixture-empty>`,
      );
      const element = parent.shadowRoot!.querySelector(
        'oscd-editor-cleanup',
      ) as OscdEditorCleanup;
      element.doc = doc;
      await element.updateComplete;

      const cleanup = element.shadowRoot!.querySelector(
        '.cleanup',
      ) as HTMLElement;
      const cleanupRect = cleanup.getBoundingClientRect();

      for (const tag of [
        'cleanup-datasets',
        'cleanup-control-blocks',
        'cleanup-data-types',
      ]) {
        const container = cleanup.querySelector(tag) as HTMLElement;
        const rect = container.getBoundingClientRect();
        expect(rect.top).to.be.greaterThanOrEqual(cleanupRect.top);
        expect(rect.bottom).to.be.lessThanOrEqual(
          cleanupRect.bottom,
          `${tag} is clipped below the cleanup container`,
        );
        expect(rect.width).to.be.greaterThan(0, `${tag} has zero width`);
      }
    });

    it('on mobile each container stacks and scrolls with natural content height', async () => {
      const parent = await fixture<OscdEditorCleanupFixtureEmpty>(
        html`<cleanup-fixture-empty
          style="display:flex;width:400px;height:800px;"
        ></cleanup-fixture-empty>`,
      );
      const element = parent.shadowRoot!.querySelector(
        'oscd-editor-cleanup',
      ) as OscdEditorCleanup;
      element.doc = doc;
      await element.updateComplete;

      const cleanup = element.shadowRoot!.querySelector(
        '.cleanup',
      ) as HTMLElement;
      const cleanupStyle = getComputedStyle(cleanup);

      // On mobile the cleanup div should allow overflow-y scroll so stacked
      // containers can be scrolled through, not clipped.
      expect(cleanupStyle.overflowY).to.equal('auto');
    });
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
