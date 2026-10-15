import {resolve} from 'path';
import {mergeConfig} from 'vite';
import svgr from 'vite-plugin-svgr';
import type {StorybookConfig} from '@storybook/react-vite';

// Absolute path to a directory under src/, always with a trailing slash so
// prefix aliases (e.g. "@schema/") map onto "…/src/schema/".
const srcDir = (p: string) => `${resolve(process.cwd(), 'src', p)}/`;
// Absolute path to a file/dir under src/ without a trailing slash, for the
// exact-match aliases ("@design", "@typing").
const srcPath = (p: string) => resolve(process.cwd(), 'src', p);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  // What the branded manager UI loads (manager.ts, manager-head.html): the Habarico logo and the
  // brand font. Both are addressed relatively from the manager, so they have to sit at a fixed
  // place inside the build rather than be bundled — the same build is served from the root of the
  // bucket and from a `<series>/` prefix (HAB-763).
  staticDirs: [
    {from: './brand', to: '/brand'},
    {from: '../node_modules/@fontsource-variable/dm-sans/files', to: '/brand/fonts'},
  ],
  docs: {
    // @ts-ignore
    autodocs: 'tag',
  },
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Story files are excluded from tsconfig.json ("exclude"), so
    // vite-tsconfig-paths refuses to resolve the "@…" path aliases inside
    // them. Declare the aliases explicitly here instead — this works for
    // story files, regular source, and the esbuild dependency scan alike,
    // regardless of the underlying Vite flavour.
    return mergeConfig(config, {
      // Pre-bundle what the stories reach for, instead of letting Vite discover it story by
      // story. The page-level stories (src/*/pages/**) boot a whole React Admin screen, so the
      // first visit to one is where Vite would otherwise find react-admin and the MUI packages
      // for the first time, re-optimize, and reload the browser mid-session - losing the story
      // you were looking at. vitest.config.ts carries the same guard for the story tests, where
      // the reload leaves a second copy of React behind and every hook call throws; here the
      // damage is only the wait, but it is the wait that makes Storybook feel slow.
      optimizeDeps: {
        include: [
          'react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom',
          'react-dom/client',
          'react-router',
          'react-router-dom',
          'react-hook-form',
          'react-admin',
          'ra-core',
          'ra-ui-materialui',
          'ra-i18n-polyglot',
          '@emotion/react',
          '@emotion/styled',
          '@mui/material',
          '@mui/icons-material',
          '@mui/x-data-grid',
        ],
      },
      // Match the library build (`@svgr/rollup`): turn every project `.svg`
      // default import into a React component so illustration/logo SVGs render
      // in Storybook instead of resolving to a URL string. `svgo: false` mirrors
      // the rollup config; node_modules SVGs are left as-is.
      plugins: [
        svgr({
          include: '**/*.svg',
          exclude: '**/node_modules/**',
          svgrOptions: {svgo: false},
        }),
      ],
      resolve: {
        alias: [
          {find: /^@admin\//, replacement: srcDir('admin')},
          {find: /^@admin$/, replacement: srcPath('admin')},
          {find: /^@assets\//, replacement: srcDir('assets')},
          {find: /^@design\//, replacement: srcDir('design')},
          {find: /^@design$/, replacement: srcPath('design')},
          {find: /^@foundation\//, replacement: srcDir('foundation')},
          {find: /^@foundation$/, replacement: srcPath('foundation')},
          {find: /^@schema\//, replacement: srcDir('schema')},
          {find: /^@typing$/, replacement: srcPath('types')},
        ],
      },
    });
  },
};
export default config;
