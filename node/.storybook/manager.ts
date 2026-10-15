import {addons} from 'storybook/manager-api';
import {create} from 'storybook/theming/create';

// The Storybook UI itself — sidebar, toolbar, addon panel — dressed in the habarico.com brand, so
// that a reader arriving from a documentation page does not land on a different product (HAB-763).
// The canvas is deliberately untouched: what renders there is the library's own MUI theme, light
// or dark, which is the thing being documented.
//
// The tokens are the ones the documentation site uses (docs/src/css/custom.css); they are repeated
// rather than imported because nothing links these two builds together.
const BRAND = {
  primary: '#343b74',
  accent: '#32ccb1',
  backgroundDefault: '#f9fafb',
  backgroundNeutral: '#f4f6f8',
  border: '#dfe3e8',
  text: '#12152d',
  textMuted: '#637381',
};

addons.setConfig({
  theme: create({
    base: 'light',

    // `brandImage` and everything else the manager loads is addressed **relatively**, and has to
    // stay that way: the same build is served both from the root of the bucket and from a
    // `<series>/` prefix (HAB-763), so a leading slash would break every copy under a prefix.
    brandTitle: 'Habarico',
    brandImage: './brand/logo.svg',
    brandUrl: 'https://docs.habarico.com',
    brandTarget: '_self',

    // "DM Sans Variable" is the library's own primary font (src/design/theme/core/typography.ts,
    // via @fontsource-variable/dm-sans), so the manager chrome matches the thing it documents. The
    // plain name is there for anyone who has the font installed, and the stack behind it for the
    // seconds before the file arrives. Loaded in manager-head.html.
    fontBase:
      '"DM Sans Variable", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontCode:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',

    colorPrimary: BRAND.primary,
    colorSecondary: BRAND.primary,

    appBg: BRAND.backgroundNeutral,
    appContentBg: '#ffffff',
    appPreviewBg: '#ffffff',
    appBorderColor: BRAND.border,
    appBorderRadius: 8,

    textColor: BRAND.text,
    textInverseColor: '#ffffff',
    textMutedColor: BRAND.textMuted,

    barBg: BRAND.backgroundDefault,
    barTextColor: BRAND.textMuted,
    // The accent is the brand's second colour and marks the selected tab, the way the docs site
    // uses it for the active item.
    barSelectedColor: BRAND.primary,
    barHoverColor: BRAND.accent,

    inputBg: '#ffffff',
    inputBorder: BRAND.border,
    inputTextColor: BRAND.text,
    inputBorderRadius: 6,
  }),
});
