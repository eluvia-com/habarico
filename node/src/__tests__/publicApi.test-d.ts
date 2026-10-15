// Type-level half of the public API contract (HAB-813). Packages built on this library import these
// types from its entry point, so they have to survive on it; a type dropped from a barrel
// is invisible to the runtime test next to this file. Compiled by `npm run typecheck` but never
// bundled (nothing imports it) and ignored by vitest (`.test-d.ts` does not match `*.test.ts`).
import type {FieldProps, InputProps, SchemaRootContextState} from '../index';

// The base props every custom field / input builds on.
const _field: FieldProps = {source: 'name'};
const _input: InputProps = {source: 'name'};
// The shape `useSchemaRootContext()` returns — public, unlike its own type until now.
const _root: SchemaRootContextState = {} as SchemaRootContextState;
