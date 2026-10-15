// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import boundaries from 'eslint-plugin-boundaries';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import storybook from 'eslint-plugin-storybook';
import {defineConfig} from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default defineConfig([
  // Ignore patterns
  {ignores: ['eslint.config.mjs', 'lib/**', 'storybook-static/**']},

  // JS/TS base config
  {files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'], plugins: {js}, extends: ['js/recommended']},
  {files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'], languageOptions: {globals: globals.browser}},

  // Node globals for tooling/config files
  {
    files: [
      'rollup.config.*',
      'vite.config.*',
      '**/*.config.{js,mjs,cjs,ts,mts,cts}',
      'scripts/**/*.{js,mjs,cjs,ts,mts,cts}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // React config
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      react: pluginReact,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  pluginReact.configs.flat.recommended,
  pluginReactHooks.configs.flat['recommended-latest'],
  pluginReactRefresh.configs.recommended,

  // SonarJS config
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      sonarjs,
    },
    rules: {
      ...sonarjs.configs.recommended.rules,
    },
  },

  // Prettier config
  eslintPluginPrettierRecommended,

  // TypeScript config
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Storybook config
  ...storybook.configs['flat/recommended'],

  // Import-boundary lint — enforce the architectural layering (HAB-668/HAB-690).
  //
  // Dependencies must flow strictly DOWNWARD:  schema → admin → design → foundation.
  // Any import "up" a layer (e.g. admin importing @schema) fails lint and therefore CI.
  //
  // Each `src/<layer>` folder is one element; imports within a layer are "internal" and
  // ignored, imports to non-layer files (src/index.ts, src/types.ts, src/assets, …) are
  // "unknown locals" and ignored, and external packages (react-admin, MUI, …) are not
  // checked here — only the cross-layer direction is enforced.
  {
    files: ['src/**/*.{ts,mts,cts,tsx}'],
    plugins: {boundaries},
    settings: {
      'boundaries/elements': [
        {type: 'foundation', pattern: 'src/foundation'},
        {type: 'design', pattern: 'src/design'},
        {type: 'admin', pattern: 'src/admin'},
        {type: 'schema', pattern: 'src/schema'},
      ],
      'import/resolver': {
        typescript: {alwaysTryTypes: true, project: './tsconfig.json'},
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'Layer violation: this file may not import "up" a layer. Dependencies must flow downward: schema → admin → design → foundation.',
          policies: [
            {
              from: [{element: {type: 'foundation'}}],
              allow: [{to: {element: {type: 'foundation'}}}],
            },
            {
              from: [{element: {type: 'design'}}],
              allow: [{to: {element: {type: ['design', 'foundation']}}}],
            },
            {
              from: [{element: {type: 'admin'}}],
              allow: [{to: {element: {type: ['admin', 'design', 'foundation']}}}],
            },
            {
              from: [{element: {type: 'schema'}}],
              allow: [{to: {element: {type: ['schema', 'admin', 'design', 'foundation']}}}],
            },
          ],
        },
      ],
    },
  },

  // Icon-import lint — funnel every glyph through the `Icon` primitive (HAB-XXX).
  //
  // `design/atoms/Icon/MaterialIcon.tsx` is the single place allowed to reach into
  // `@mui/icons-material` for a specific glyph; everywhere else must go through
  // `<Icon icon={IconType.X} />` so icons share one rendering convention (the `Rounded` glyph
  // set, theme-driven icon set, `size`/modifiers) instead of importing MUI's default style
  // ad hoc. Stories may still import a raw MUI icon to decorate an unrelated demo (e.g. an
  // example `startAdornment`), since they document that component, not the icon system.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/**/*.stories.tsx',
      'src/**/__tests__/**',
      'src/design/atoms/Icon/MaterialIcon.tsx',
      // `NoteAddOutlined` has no `Rounded` counterpart in @mui/icons-material — the outlined
      // style can't be expressed through the Icon primitive's always-`Rounded` convention.
      'src/design/organisms/UploadArea/UploadArea.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@mui/icons-material/*'],
              message:
                'Import icons through the design system instead: <Icon icon={IconType.X} /> from "@design/atoms/Icon". Add the glyph to IconType (src/design/atoms/Icon/enums.ts) if it is missing.',
            },
          ],
        },
      ],
    },
  },
]);
