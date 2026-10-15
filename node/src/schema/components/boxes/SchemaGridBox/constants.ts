// Breakpoints a scaled `labelWidth` has to cover. Once any single breakpoint needs scaling, every
// one of them must be emitted explicitly — see `computeLabelWidth` in `./utils` for why.
export const LABEL_WIDTH_BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

// `PropertyItem`'s own default label-column width, as a bare percent number so the scaling math can
// compute with it. Kept in sync with the `labelWidth` default in `PropertyItem` (`'40%'`).
export const DEFAULT_LABEL_PERCENT = 40;
