import {describe, expect, it} from 'vitest';
import {
  FIELDSET_DEFAULT,
  FIELD_ALL,
  FIELD_DEFAULT,
  actionDescriptorsToFieldSelection,
  descriptorsNeedAllActions,
  fieldDescriptorsToActionSelection,
  fieldDescriptorsToFieldSelection,
  mergeFieldSelections,
  parseFieldSelection,
  serializeFieldSelection,
} from '../fieldSelection';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

describe('constants', () => {
  it('FIELD_DEFAULT is __default__', () => {
    expect(FIELD_DEFAULT).toBe('__default__');
  });

  it('FIELD_ALL is __all__', () => {
    expect(FIELD_ALL).toBe('__all__');
  });

  it('FIELDSET_DEFAULT is {__default__: __default__}', () => {
    expect(FIELDSET_DEFAULT).toEqual({[FIELD_DEFAULT]: FIELD_DEFAULT});
  });
});

// ----------------------------------------------------------------------------
// parseFieldSelection
// ----------------------------------------------------------------------------

describe('parseFieldSelection', () => {
  it('parses a single field', () => {
    expect(parseFieldSelection('name')).toEqual({name: FIELD_DEFAULT});
  });

  it('parses multiple comma-separated fields', () => {
    expect(parseFieldSelection('id,name,email')).toEqual({
      id: FIELD_DEFAULT,
      name: FIELD_DEFAULT,
      email: FIELD_DEFAULT,
    });
  });

  it('parses nested fields', () => {
    expect(parseFieldSelection('category(id,name)')).toEqual({
      category: {id: FIELD_DEFAULT, name: FIELD_DEFAULT},
    });
  });

  it('parses deeply nested fields', () => {
    expect(parseFieldSelection('a(b(c))')).toEqual({
      a: {b: {c: FIELD_DEFAULT}},
    });
  });

  it('parses field with __all__ modifier', () => {
    expect(parseFieldSelection('items(__all__)')).toEqual({items: FIELD_ALL});
  });

  it('parses field with __default__ modifier', () => {
    expect(parseFieldSelection('items(__default__)')).toEqual({items: FIELD_DEFAULT});
  });

  it('parses mixed flat and nested fields', () => {
    expect(parseFieldSelection('id,category(name),email')).toEqual({
      id: FIELD_DEFAULT,
      category: {name: FIELD_DEFAULT},
      email: FIELD_DEFAULT,
    });
  });

  it('handles commas inside nested parens correctly', () => {
    expect(parseFieldSelection('a(x,y),b')).toEqual({
      a: {x: FIELD_DEFAULT, y: FIELD_DEFAULT},
      b: FIELD_DEFAULT,
    });
  });
});

// ----------------------------------------------------------------------------
// serializeFieldSelection
// ----------------------------------------------------------------------------

describe('serializeFieldSelection', () => {
  it('serializes a single field', () => {
    expect(serializeFieldSelection({name: FIELD_DEFAULT})).toBe('name');
  });

  it('serializes multiple fields', () => {
    const result = serializeFieldSelection({id: FIELD_DEFAULT, name: FIELD_DEFAULT});
    expect(result.split(',')).toEqual(expect.arrayContaining(['id', 'name']));
  });

  it('serializes nested fields', () => {
    expect(serializeFieldSelection({category: {id: FIELD_DEFAULT, name: FIELD_DEFAULT}})).toBe(
      'category(id,name)'
    );
  });

  it('serializes __all__ with parens', () => {
    expect(serializeFieldSelection({items: FIELD_ALL})).toBe('items(__all__)');
  });

  it('serializes a custom string modifier with parens', () => {
    expect(serializeFieldSelection({field: 'custom'})).toBe('field(custom)');
  });

  it('round-trips with parseFieldSelection', () => {
    const original = 'id,category(name,type),tags(__all__)';
    expect(serializeFieldSelection(parseFieldSelection(original))).toBe(original);
  });
});

// ----------------------------------------------------------------------------
// mergeFieldSelections
// ----------------------------------------------------------------------------

describe('mergeFieldSelections', () => {
  it('merges non-overlapping keys', () => {
    expect(mergeFieldSelections({a: FIELD_DEFAULT}, {b: FIELD_DEFAULT})).toEqual({
      a: FIELD_DEFAULT,
      b: FIELD_DEFAULT,
    });
  });

  it('specific value wins over __default__ from left', () => {
    expect(mergeFieldSelections({a: FIELD_DEFAULT}, {a: {x: FIELD_DEFAULT}})).toEqual({
      a: {x: FIELD_DEFAULT},
    });
  });

  it('specific value wins over __default__ from right', () => {
    expect(mergeFieldSelections({a: {x: FIELD_DEFAULT}}, {a: FIELD_DEFAULT})).toEqual({
      a: {x: FIELD_DEFAULT},
    });
  });

  it('__all__ wins over nested object from right', () => {
    expect(mergeFieldSelections({a: {x: FIELD_DEFAULT}}, {a: FIELD_ALL})).toEqual({a: FIELD_ALL});
  });

  it('__all__ wins over nested object from left', () => {
    expect(mergeFieldSelections({a: FIELD_ALL}, {a: {x: FIELD_DEFAULT}})).toEqual({a: FIELD_ALL});
  });

  it('merges two nested objects recursively', () => {
    expect(mergeFieldSelections({a: {x: FIELD_DEFAULT}}, {a: {y: FIELD_DEFAULT}})).toEqual({
      a: {x: FIELD_DEFAULT, y: FIELD_DEFAULT},
    });
  });

  it('merges three or more selections', () => {
    expect(
      mergeFieldSelections({a: FIELD_DEFAULT}, {b: FIELD_DEFAULT}, {c: FIELD_DEFAULT})
    ).toEqual({a: FIELD_DEFAULT, b: FIELD_DEFAULT, c: FIELD_DEFAULT});
  });

  it('returns empty object for no arguments', () => {
    expect(mergeFieldSelections()).toEqual({});
  });
});

// ----------------------------------------------------------------------------
// fieldDescriptorsToFieldSelection
// ----------------------------------------------------------------------------

describe('fieldDescriptorsToFieldSelection', () => {
  it('maps simple field names to FIELD_DEFAULT', () => {
    expect(
      fieldDescriptorsToFieldSelection([
        {type: 'field', name: 'title'},
        {type: 'field', name: 'email'},
      ])
    ).toEqual({
      title: FIELD_DEFAULT,
      email: FIELD_DEFAULT,
    });
  });

  it('skips action fields', () => {
    expect(
      fieldDescriptorsToFieldSelection([
        {type: 'field', name: 'title'},
        {type: 'field', name: 'edit', action: {name: 'edit'}},
      ])
    ).toEqual({title: FIELD_DEFAULT});
  });

  it('uses top-level key for __ notation', () => {
    expect(fieldDescriptorsToFieldSelection([{type: 'field', name: 'category__name'}])).toEqual({
      category: FIELD_DEFAULT,
    });
  });

  it('deduplicates top-level keys from __ notation', () => {
    expect(
      fieldDescriptorsToFieldSelection([
        {type: 'field', name: 'category__name'},
        {type: 'field', name: 'category__id'},
      ])
    ).toEqual({category: FIELD_DEFAULT});
  });

  it('recurses into wrapper fields', () => {
    expect(
      fieldDescriptorsToFieldSelection([
        {
          type: 'field',
          name: 'wrapper',
          wrapper: {
            fields: [
              {type: 'field', name: 'title'},
              {type: 'field', name: 'slug'},
            ],
          },
        },
      ])
    ).toEqual({title: FIELD_DEFAULT, slug: FIELD_DEFAULT});
  });

  it('skips action fields inside wrapper', () => {
    expect(
      fieldDescriptorsToFieldSelection([
        {
          type: 'field',
          name: 'wrapper',
          wrapper: {
            fields: [
              {type: 'field', name: 'title'},
              {type: 'field', name: 'delete', action: {name: 'delete'}},
            ],
          },
        },
      ])
    ).toEqual({title: FIELD_DEFAULT});
  });
});

// ----------------------------------------------------------------------------
// fieldDescriptorsToActionSelection
// ----------------------------------------------------------------------------

describe('fieldDescriptorsToActionSelection', () => {
  it('maps action field names to FIELD_DEFAULT', () => {
    expect(
      fieldDescriptorsToActionSelection([
        {type: 'field', name: 'edit', action: {name: 'edit'}},
        {type: 'field', name: 'delete', action: {name: 'delete'}},
      ])
    ).toEqual({edit: FIELD_DEFAULT, delete: FIELD_DEFAULT});
  });

  it('skips non-action fields', () => {
    expect(
      fieldDescriptorsToActionSelection([
        {type: 'field', name: 'title'},
        {type: 'field', name: 'edit', action: {name: 'edit'}},
      ])
    ).toEqual({edit: FIELD_DEFAULT});
  });

  it('returns empty object when no action fields', () => {
    expect(
      fieldDescriptorsToActionSelection([
        {type: 'field', name: 'title'},
        {type: 'field', name: 'email'},
      ])
    ).toEqual({});
  });

  it('recurses into wrapper fields', () => {
    expect(
      fieldDescriptorsToActionSelection([
        {
          type: 'field',
          name: 'wrapper',
          wrapper: {
            fields: [
              {type: 'field', name: 'title'},
              {type: 'field', name: 'edit', action: {name: 'edit'}},
            ],
          },
        },
      ])
    ).toEqual({edit: FIELD_DEFAULT});
  });
});

// ----------------------------------------------------------------------------
// actionDescriptorsToFieldSelection
// ----------------------------------------------------------------------------

describe('actionDescriptorsToFieldSelection', () => {
  it('leaves out DefaultActions entries, which name no action', () => {
    expect(
      actionDescriptorsToFieldSelection([
        {name: 'show'},
        {type: 'default_actions', scope: 'detail'},
      ])
    ).toEqual({show: FIELD_DEFAULT});
  });

  it('returns empty object for empty array', () => {
    expect(actionDescriptorsToFieldSelection([])).toEqual({});
  });

  it('maps action names to FIELD_DEFAULT', () => {
    expect(
      actionDescriptorsToFieldSelection([{name: 'show'}, {name: 'edit'}, {name: 'delete'}])
    ).toEqual({show: FIELD_DEFAULT, edit: FIELD_DEFAULT, delete: FIELD_DEFAULT});
  });

  it('handles single action', () => {
    expect(actionDescriptorsToFieldSelection([{name: 'show'}])).toEqual({show: FIELD_DEFAULT});
  });
});

describe('descriptorsNeedAllActions', () => {
  it("is true when the slot expands the record's own defaults", () => {
    expect(descriptorsNeedAllActions([{name: 'show'}, {type: 'default_actions'}])).toBe(true);
  });

  it('is false for named actions and for defaults of another resource', () => {
    const reference = {service: 'billing', resource: 'invoice'};
    expect(descriptorsNeedAllActions([{name: 'show'}, {type: 'default_actions', reference}])).toBe(
      false
    );
  });
});
