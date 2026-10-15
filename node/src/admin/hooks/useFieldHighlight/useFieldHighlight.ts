import {useRecordContext} from 'react-admin';
import {SearchObjectHighlight} from '@admin/utils/highlight';

// Returns the search highlight for the given field on the current record, if it matched.
// Highlights are delivered as a `meta.highlights` sidecar on list records (see openapi
// SearchHighlights) and are keyed by the field path (`name`). The backend traverses relations
// with `__`, whereas the FE field source uses `.` (or the bare foreign-key name), so paths are
// normalised before matching. A relation field (source is the foreign key) is flagged as a whole
// when any of its sub-attributes matched (e.g. source `customer` matches `customer__company_name`).
export const useFieldHighlight = (source?: string): SearchObjectHighlight | undefined => {
  const record = useRecordContext();
  if (!source || !record) return undefined;
  const highlights: SearchObjectHighlight[] | undefined = record.meta?.highlights;
  return highlights?.find((highlight) => {
    const path = highlight.name.replace(/__/g, '.');
    return path === source || path.startsWith(`${source}.`);
  });
};
