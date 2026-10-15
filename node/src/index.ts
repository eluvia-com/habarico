// Assets
export * from './assets/illustrations';

// Foundation layer (non-visual shared kernel — types, utils, navigation hooks)
export * from './foundation';

// Design layer (presentational, schema-agnostic primitives)
export * from './design';

// Admin layer (React Admin restyles, resource-aware, schema-agnostic) — the full curated barrel.
export * from './admin';

// Schema layer (schema-driven core: components, providers, contexts, hooks, utils, types) — full barrel.
export * from './schema';

// The whole schema surface (providers, base entry points, views, collections, widgets, dashboard,
// reference fields, `ResourceButton`, hooks, contexts, utils, schema types, constants) now comes via
// the `export * from './schema'` barrel above — the per-member re-exports were removed to keep a
// single source of truth. The schema providers remain public but are considered deprecated.

// Root core types (src/types.ts) — distinct from the schema layer's own `@schema/types`.
export * from './types';
