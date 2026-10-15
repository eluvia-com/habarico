import type {SourceContextValue} from 'react-admin';

/**
 * Per-row source context for a field-array container: prefixes a cell's `source` with the row's
 * index, so a child input carrying `source="name"` binds to `owners.{index}.name`. An empty source
 * resolves to the row itself (`owners.{index}`), which is what an input bound to a scalar array
 * element needs.
 *
 * Replicates what React Admin's own `SimpleFormIteratorItem` provides — including the detail that
 * `getLabel` is passed through **untouched**: labels resolve to translation keys
 * (`resources.<resource>.fields.<source>`), which must not carry a row index.
 *
 * `index` accepts a string for a row that has no array index yet — a checklist row standing for a
 * choice nobody has ticked. Such a row points at a form path that does not exist, which is harmless
 * as long as its cells are rendered read-only or disabled.
 */
export const rowSourceContext = (
  parent: SourceContextValue,
  index: number | string
): SourceContextValue => ({
  getSource: (source) =>
    source ? parent.getSource(`${index}.${source}`) : parent.getSource(`${index}`),
  getLabel: (source) => parent.getLabel(source),
});
