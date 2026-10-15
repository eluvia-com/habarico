import {describe, expect, it} from 'vitest';
import {getCachedConditionAst, getConditionDependencies} from '../conditionExpression';

describe('getConditionDependencies', () => {
  it('collects a single data. path as a reactive dependency', () => {
    expect(getConditionDependencies('data.is_company == true')).toEqual({
      paths: ['is_company'],
      unscoped: false,
    });
  });

  it('collects a nested data. path whole', () => {
    expect(getConditionDependencies('data.address.city == "Prague"')).toEqual({
      paths: ['address.city'],
      unscoped: false,
    });
  });

  it('collects formData. paths the same way as data.', () => {
    expect(getConditionDependencies('formData.foo == 1')).toEqual({
      paths: ['foo'],
      unscoped: false,
    });
  });

  it('collects every data./formData. path referenced on both sides of the expression', () => {
    const {paths, unscoped} = getConditionDependencies('data.a == data.b');
    expect(unscoped).toBe(false);
    expect([...paths].sort()).toEqual(['a', 'b']);
  });

  it('drops record. and viewData. roots — not reactive, nothing to watch', () => {
    expect(getConditionDependencies('record.status == "active"')).toEqual({
      paths: [],
      unscoped: false,
    });
    expect(getConditionDependencies('viewData.mode == "edit"')).toEqual({
      paths: [],
      unscoped: false,
    });
  });

  it('marks an expression referencing parent. as unscoped', () => {
    expect(getConditionDependencies('parent.data.foo == 1').unscoped).toBe(true);
  });

  it('marks the whole expression unscoped when only one side is resolvable', () => {
    // Partially watching `data.a` here would miss changes to whatever `parent.data.b` depends on —
    // falling back to a full watch is the safe choice, not a partial dependency list.
    expect(getConditionDependencies('data.a == parent.data.b').unscoped).toBe(true);
  });

  it('is unscoped (rather than throwing) for an expression that fails to parse', () => {
    expect(getConditionDependencies('`shell command`')).toEqual({paths: [], unscoped: true});
  });

  it('caches the result per expression string', () => {
    const query = 'data.is_company == true';
    expect(getConditionDependencies(query)).toBe(getConditionDependencies(query));
    expect(getCachedConditionAst(query)).toBe(getCachedConditionAst(query));
  });
});
