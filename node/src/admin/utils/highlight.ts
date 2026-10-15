// A single search-match highlight for one field value, delivered on a record's `meta.highlights`
// sidecar (see openapi `SearchHighlights`). Schema-agnostic: the admin fields read `value`/`offsets`
// to render the mark, `useFieldHighlight` matches on `name`. The schema layer's `SearchObjectHighlight`
// is this same shape, re-exported through `@schema/types`.
export type SearchObjectHighlight = {
  name: string;
  value: string;
  label: string;
  // Half-open [start, end] spans of each match in the raw (unformatted) field value.
  // Used to place markers on a value the FE reformats (e.g. numbers). See openapi SearchHighlights.
  offsets?: [number, number][];
};

type SelfHighlighting = {selfHighlights?: boolean};

// Tags a field component as rendering its own inline search highlight, so SchemaFieldContent skips
// the generic whole-value mark for it. Use at the component definition; read via
// isSelfHighlightingField.
export const selfHighlightingField = <T extends object>(component: T): T => {
  (component as T & SelfHighlighting).selfHighlights = true;
  return component;
};

export const isSelfHighlightingField = (type: unknown): boolean =>
  !!type && (type as SelfHighlighting).selfHighlights === true;
