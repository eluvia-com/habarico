import {CreatePathParams, RaRecord} from 'react-admin';
import {SearchObjectHighlight} from '@admin/utils/highlight';

export type ReservedViewType = CreatePathParams['type'];
// Standard react-admin routes. The single frontend source of truth for "which
// view types route to a reserved URL"; non-reserved views use the /a/{action_name} route.
export const RESERVED_VIEW_TYPES: readonly ReservedViewType[] = ['list', 'create', 'edit', 'show'];

// The generic record `meta` sidecar the admin skin understands — a schema-agnostic subset of the
// Habarico record meta. The schema layer's richer `RecordMeta` / `HabRecord` (in `@schema/types`)
// are structural supersets of these, so a schema record is always assignable where an `AdminRecord`
// is expected.
export type AdminRecordMeta = {
  // Human-readable representation of the record (used e.g. in delete confirmations).
  repr?: string;
  // Search-match sidecar, present on list records when the request matched a search.
  highlights?: SearchObjectHighlight[];
};

export type AdminRecord = RaRecord & {
  meta?: AdminRecordMeta;
};
