import OscdEditorCleanup from '../oscd-editor-cleanup.js';

const { registry } = document.querySelector('oscd-shell');
registry.define('oscd-editor-cleanup', OscdEditorCleanup);

export const plugins = {
  menu: [
    {
      name: 'Open File',
      translations: { de: 'Datei öffnen' },
      icon: 'folder_open',
      src: 'https://openscd.github.io/oscd-open/oscd-open.js',
    },
    {
      name: 'Save File',
      translations: { de: 'Datei speichern' },
      icon: 'save',
      requireDoc: true,
      src: 'https://openscd.github.io/oscd-save/oscd-save.js',
    },
  ],
  editor: [
    {
      name: 'Cleanup',
      translations: { de: 'Bereinigung' },
      icon: 'cleaning_services',
      requireDoc: true,
      tagName: 'oscd-editor-cleanup',
    },
  ],
  background: [],
};
