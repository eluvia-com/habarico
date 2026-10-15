import {describe, expect, it} from 'vitest';
import * as habarico from '../index';

// The public entry point is the contract a package built on this library compiles against (HAB-813):
// it imports from `@eluvia/habarico`, not through the `@schema`/`@admin`/`@design` aliases, so a
// symbol dropped from a barrel breaks it at build time rather than here. These are the value exports
// such a package needs; the type half is guarded by `publicApi.test-d.ts`.
describe('public API', () => {
  it.each([
    // Consumer hooks whose providers are already public — exporting one without the other left
    // the context unusable from outside the package.
    'useFieldSchemaMapContext',
    'useLocalResourceSchemaContext',
    // Composed by the table widget.
    'SchemaDatagridRowActions',
    // Widget colour options.
    'COLOR_TYPES',
    // Hand-assembling `SchemaRootContextProvider` — what `SchemaAdmin` wires up itself.
    'SchemaRootContextProvider',
    'SchemaIdentitySync',
    'SchemaLayout',
    'defaultViewProvider',
    'usePerUserStore',
    'withRaDefaults',
    // A stable hash router above a hand-assembled `<AdminContext>`.
    'AdminHashRouter',
  ])('exports %s', (name) => {
    expect(habarico).toHaveProperty(name);
    expect(habarico[name as keyof typeof habarico]).toBeDefined();
  });
});
