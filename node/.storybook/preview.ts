import type {Preview} from '@storybook/react-vite';
import {createElement, type ReactNode} from 'react';
import {CssBaseline, type Theme, ThemeProvider} from '@mui/material';
import {withRaDefaults} from '../src/admin/theme';
import {DocsPage} from './DocsPage';
import {createDarkTheme, createLightTheme} from '../src/design/theme';
import '../src/global.css';

// Wrap the design themes the same way `BaseAdmin`/`SchemaAdmin` do in production, so React Admin
// inputs rendered in stories don't reserve an empty helper-text row (which pins their height and
// adds a phantom bottom gap). `withRaDefaults` only adds `Ra*Input`/`Ra{View}` keys — a no-op for
// design-layer stories and idempotent for the admin shell stories that boot `BaseAdmin` themselves.
const lightTheme = withRaDefaults(createLightTheme() as Theme);
const darkTheme = withRaDefaults(createDarkTheme() as Theme);

// Storybook's built-in backgrounds addon paints the real preview surface
// (`.sb-show-main` in Canvas, `.docs-story` in Docs) via injected CSS — no
// wrapper element, so it never affects a story's own layout/sizing. We read
// its toolbar selection here to drive the MUI theme too, so a single toggle
// switches both the canvas colour and the component colours.
const withThemeFromBackground = (
  Story: () => ReactNode,
  context: {globals: {backgrounds?: {value?: string}}}
) => {
  const theme = context.globals.backgrounds?.value === 'dark' ? darkTheme : lightTheme;
  return createElement(ThemeProvider, {theme}, createElement(CssBaseline), createElement(Story));
};

// @storybook/react's "Show code" (any story with a custom `render`, i.e. most of our showcases —
// pure `args` stories aren't affected) falls back to `React.ForwardRef` for every MUI component,
// because its built-in name resolver checks `el.type.$$typeof` being a symbol *before* it tries
// `el.type.render.name` — so a `React.forwardRef` component (MUI ships almost nothing else) never
// reaches the branch that would resolve its real name, even though MUI's compiled output names
// the inner function (`React.forwardRef(function Button(...) {...})`), so `.render.name` is right
// there. This reimplements the resolver with that check reordered; `parameters.jsx.displayName`
// fully replaces Storybook's default (it isn't merged), so every other case (plain function/class
// components, host tags, memo, fragments) is reproduced here too, not just the forwardRef fix.
const REACT_SYMBOL_NAMES: Record<string, string> = {
  'Symbol(react.fragment)': 'React.Fragment',
  'Symbol(react.strict_mode)': 'React.StrictMode',
  'Symbol(react.profiler)': 'React.Profiler',
  'Symbol(react.suspense)': 'React.Suspense',
  'Symbol(react.suspense_list)': 'React.SuspenseList',
};

const resolveJsxDisplayName = (el: {type: unknown}): string => {
  const rawType = el.type;
  if (typeof rawType === 'string') return rawType;
  if (typeof rawType === 'symbol')
    return REACT_SYMBOL_NAMES[rawType.toString()] ?? rawType.toString();
  const type = rawType as {
    $$typeof?: symbol;
    displayName?: string;
    name?: string;
    render?: {displayName?: string; name?: string};
    type?: {displayName?: string; name?: string};
  };
  const innerTypeof = type?.$$typeof;
  if (typeof innerTypeof === 'symbol') {
    const key = innerTypeof.toString();
    if (key === 'Symbol(react.forward_ref)') {
      return type.displayName ?? type.render?.displayName ?? type.render?.name ?? 'ForwardRef';
    }
    if (key === 'Symbol(react.memo)') {
      return type.displayName ?? type.type?.displayName ?? type.type?.name ?? 'Memo';
    }
    return REACT_SYMBOL_NAMES[key] ?? key;
  }
  return type?.displayName ?? (type?.name && type.name !== '_default' ? type.name : 'Component');
};

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    jsx: {displayName: resolveJsxDisplayName},
    backgrounds: {
      options: {
        light: {name: 'Light', value: lightTheme.palette.background.default},
        dark: {name: 'Dark', value: darkTheme.palette.background.default},
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Table of contents on every autodocs page. Autodocs itself is opted into
    // per-meta (`tags: ['autodocs']`) so only the design layer is documented.
    //
    // `page: DocsPage` (./DocsPage.tsx) is Storybook's own default autodocs template with one
    // change: it drops the primary story (`Playground`, by convention) from the "Stories" list
    // below, where the default template lists it a second time — a static echo of the same story
    // already shown live at the top, minus the Controls panel that made it interactive.
    docs: {
      toc: true,
      page: DocsPage,
    },
    options: {
      storySort: {
        // Pin the design-system entry points first; everything else stays
        // alphabetical. Titles must match exactly.
        order: [
          'design',
          ['Welcome', 'Theme', 'atoms', 'molecules', 'organisms', 'layouts', 'pages', 'hooks'],
          'admin',
          ['Welcome', 'pages'],
          'schema',
          ['Welcome', 'pages'],
        ],
        method: 'alphabetical',
      },
    },
  },
  initialGlobals: {
    backgrounds: {value: 'light'},
  },
  decorators: [withThemeFromBackground],
};

export default preview;
