import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import copy from 'rollup-plugin-copy';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const name = packageJson.name.split('/').pop();

const pluginConfig = {
  input: `src/${name}.ts`,
  output: {
    sourcemap: true,
    format: 'es',
    dir: 'dist',
  },
  preserveEntrySignatures: 'strict',
  external: ['ace-builds'],
  plugins: [
    nodeResolve(),
    typescript(),
    importMetaAssets(),
    copy({
      targets: [
        { src: 'demo/sample.scd', dest: 'dist/demo' },
        {
          src: [
            'node_modules/ace-custom-element/dist/ace/worker-xml.js',
            'node_modules/ace-custom-element/dist/ace/mode-xml.js',
            'node_modules/ace-custom-element/dist/ace/theme-solarized_light.js',
            'node_modules/ace-custom-element/dist/ace/theme-solarized_dark.js',
          ],
          dest: 'dist/ace/',
        },
      ],
      verbose: true,
      flatten: true,
    }),
  ],
};

const deployConfig = {
  input: './demo/shell.deploy.js',
  output: {
    sourcemap: true,
    format: 'es',
    file: 'dist/demo/shell.deploy.js',
  },
  plugins: [
    nodeResolve(),
    copy({
      targets: [
        { src: 'demo/index.deploy.html', dest: 'dist', rename: 'index.html' },
        { src: '.nojekyll', dest: 'dist' },
        { src: 'demo/plugins.deploy.js', dest: 'dist/demo' },
        { src: 'demo/sysconex-theme', dest: 'dist/demo' },
        { src: 'demo/sample.scd', dest: 'dist/demo' },
        { src: 'dist/docs', dest: 'dist/demo' },
      ],
      verbose: true,
    }),
    importMetaAssets(),
  ],
};

export default [pluginConfig, deployConfig];
