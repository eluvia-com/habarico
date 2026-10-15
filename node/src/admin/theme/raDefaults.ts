import {Theme} from '@mui/material';
import {deepmerge} from '@mui/utils';

// React Admin renders a helper-text row on every input even when it is empty: `InputHelperText`
// returns a zero-width-space placeholder, and each input's
// `renderHelperText = helperText !== false || invalid` defaults to `true` (helperText === undefined).
// That reserves a fixed row and pins the input height. Defaulting `helperText` to `false` per input
// drops the row unless there is an error or an explicit helperText, giving the dynamic height of
// plain MUI:
//   - no error, no helperText → renderHelperText === invalid === false → no row
//   - error                   → the error branch of `InputHelperText` still wins
//   - explicit helperText     → the instance prop overrides this default (MUI props merge)
//
// This is React-Admin-specific (the `Ra*Input` theme keys), so it lives in the admin layer; the
// design layer stays RA-agnostic. Coverage note: `NumberInput` renders through RA `TextInput`
// (RaTextInput) and `AutocompleteArrayInput` renders through `AutocompleteInput` (RaAutocompleteInput),
// so both are handled transitively and need no key of their own.
const raInputComponents = {
  RaTextInput: {defaultProps: {helperText: false}},
  RaAutocompleteInput: {defaultProps: {helperText: false}},
  RaSelectInput: {defaultProps: {helperText: false}},
  RaSelectArrayInput: {defaultProps: {helperText: false}},
  RaDateInput: {defaultProps: {helperText: false}},
  RaDateTimeInput: {defaultProps: {helperText: false}},
  RaTimeInput: {defaultProps: {helperText: false}},
  RaBooleanInput: {defaultProps: {helperText: false}},
  RaSearchInput: {defaultProps: {helperText: false}},
  RaPasswordInput: {defaultProps: {helperText: false}},
} satisfies NonNullable<Theme['components']>;

// React Admin adds a `marginTop: 1em` to a view's main content when it is rendered without actions
// (the `Ra{View}-noActions` class). In this design system every view sits inside a card-less
// `ViewContent` / a box `Panel` that already owns the spacing, so that gap is unwanted on every view
// (list, create, edit, show) and every surface (page, dialog, side panel). Zero it globally here —
// the same override the gallery box used to carry locally, lifted to the theme so it covers all
// views. Each `noActions` rule lives on the view's `root` slot, so an equal-specificity override
// there wins (it merges after RA's own base style).
// RA's `Create`/`Edit`/`Show` wrap their content in `.Ra{View}-main` (a flex row, `min-width: 0`)
// around `.Ra{View}-card` (a plain `Card`, `display: block`). As a flex item the card defaults to
// `min-width: auto`, so it cannot shrink below its content's min-content width — a non-wrapping row
// (e.g. a scrollable `Tabs` strip) then keeps the card, and the whole view, from narrowing below
// that width instead of letting the tab strip's own horizontal scroll take over. `RaList` has no
// such card wrapper (the list surface/DataGrid already manage their own overflow).
const raViewComponents = {
  RaList: {styleOverrides: {root: {'& .RaList-noActions': {marginTop: 0}}}},
  RaCreate: {
    styleOverrides: {
      root: {
        '& .RaCreate-noActions': {marginTop: 0},
        '& .RaCreate-card': {minWidth: 0},
      },
    },
  },
  RaEdit: {
    styleOverrides: {
      root: {
        '& .RaEdit-noActions': {marginTop: 0},
        '& .RaEdit-card': {minWidth: 0},
      },
    },
  },
  RaShow: {
    styleOverrides: {
      root: {
        '& .RaShow-noActions': {marginTop: 0},
        '& .RaShow-card': {minWidth: 0},
      },
    },
  },
} satisfies NonNullable<Theme['components']>;

// Deep-merges the RA defaults (input helper-text + view spacing) into an existing theme's
// `components`, leaving every other field (customShadows, layout, radius, shadows, iconSet, palette,
// …) untouched. We merge into the built theme rather than re-running `createTheme` so the design
// layer stays the single source of truth for the theme; `deepmerge` clones by default, so the input
// theme is not mutated. The RA defaults are the base and the incoming theme's `components` are
// merged on top, so a consumer's own `RaShow`/`RaTextInput`/… overrides still win over these
// defaults where they target the same key — always calling this (see `BaseAdmin`/`SchemaAdmin`)
// must not make the defaults un-overridable.
export const withRaDefaults = (theme: Theme): Theme => ({
  ...theme,
  components: deepmerge(deepmerge(raInputComponents, raViewComponents), theme.components ?? {}),
});
