import {describe, expect, it} from 'vitest';
import {FilterSchema} from '@schema/types';
import {buildDrawerFilter, buildInlineFilter} from '@schema/utils/filterElements';

// React Admin's FilterForm / FilterButton decide visibility by reading
// `alwaysOn` / `source` off the OUTER filter element. These builders must expose
// both there, otherwise the filter shows a button but renders nothing (empty
// drawer). See filterElements.tsx for the full rationale.

const makeSchema = (overrides: Partial<FilterSchema> = {}): FilterSchema =>
  ({
    name: 'status',
    label: 'Status',
    type: 'string',
    defaultValue: 'active',
    ...overrides,
  }) as FilterSchema;

describe('filter element builders expose source/alwaysOn on the outer element', () => {
  it('buildDrawerFilter forces alwaysOn and sets source + key', () => {
    const el = buildDrawerFilter(makeSchema());
    expect(el.props.source).toBe('status');
    expect(el.props.alwaysOn).toBe(true);
    expect(el.key).toBe('status');
  });

  it('buildInlineFilter mirrors the schema isAlwaysOn flag and sets source', () => {
    expect(buildInlineFilter(makeSchema({isAlwaysOn: true})).props.alwaysOn).toBe(true);
    expect(buildInlineFilter(makeSchema({isAlwaysOn: false})).props.alwaysOn).toBe(false);

    const el = buildInlineFilter(makeSchema({isAlwaysOn: true}));
    expect(el.props.source).toBe('status');
    expect(el.key).toBe('status');
  });

  it('buildInlineFilter keeps defaultValue only for non-toolbar filters', () => {
    expect(buildInlineFilter(makeSchema({isAlwaysOn: false})).props.defaultValue).toBe('active');
    expect(buildInlineFilter(makeSchema({isAlwaysOn: true})).props.defaultValue).toBeUndefined();
  });
});
