import {ActionDescriptor, FieldDescriptor} from '@schema/types';

export type FieldSelection = {
  [field: string]: string | FieldSelection;
};

export const FIELD_DEFAULT = '__default__';
export const FIELD_ALL = '__all__';
export const FIELDSET_DEFAULT: FieldSelection = {[FIELD_DEFAULT]: FIELD_DEFAULT};

const splitAtDepthZero = (str: string): string[] => {
  const tokens: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of str) {
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      tokens.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
};

export const parseFieldSelection = (str: string): FieldSelection => {
  const tokens = splitAtDepthZero(str);
  const result: FieldSelection = {};
  for (const token of tokens) {
    const parenIdx = token.indexOf('(');
    if (parenIdx === -1) {
      result[token] = FIELD_DEFAULT;
    } else {
      const name = token.slice(0, parenIdx);
      const inner = token.slice(parenIdx + 1, -1);
      const innerTokens = splitAtDepthZero(inner);
      if (innerTokens.length === 1 && inner.startsWith('__')) {
        result[name] = inner;
      } else {
        result[name] = parseFieldSelection(inner);
      }
    }
  }
  return result;
};

export const serializeFieldSelection = (selection: FieldSelection): string => {
  return Object.entries(selection)
    .map(([key, value]) => {
      if (value === FIELD_DEFAULT) return key;
      if (value === FIELD_ALL) return `${key}(${FIELD_ALL})`;
      if (typeof value === 'string') return `${key}(${value})`;
      return `${key}(${serializeFieldSelection(value)})`;
    })
    .join(',');
};

export const mergeFieldSelections = (...selections: FieldSelection[]): FieldSelection => {
  const result: FieldSelection = {};
  for (const selection of selections) {
    for (const [key, value] of Object.entries(selection)) {
      if (!(key in result)) {
        result[key] = value;
      } else if (result[key] === FIELD_ALL || value === FIELD_ALL) {
        result[key] = FIELD_ALL;
      } else if (result[key] === FIELD_DEFAULT) {
        result[key] = value;
      } else if (value === FIELD_DEFAULT) {
        // keep existing specific value
      } else if (typeof result[key] === 'object' && typeof value === 'object') {
        result[key] = mergeFieldSelections(result[key] as FieldSelection, value as FieldSelection);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
};

export const fieldDescriptorsToFieldSelection = (fields: FieldDescriptor[]): FieldSelection => {
  let result: FieldSelection = {};
  for (const field of fields) {
    // skip action fields — they don't display data
    if (field.action) continue;

    // wrapper fields — recursively process nested fields
    if (field.wrapper) {
      result = mergeFieldSelections(result, fieldDescriptorsToFieldSelection(field.wrapper.fields));
      continue;
    }

    // __ notation (e.g. category__name) → {category: FIELD_DEFAULT}
    const topKey = field.name.includes('__') ? field.name.split('__')[0] : field.name;
    result = mergeFieldSelections(result, {[topKey]: FIELD_DEFAULT});
  }
  return result;
};

export const fieldDescriptorsToActionSelection = (fields: FieldDescriptor[]): FieldSelection => {
  let result: FieldSelection = {};
  for (const field of fields) {
    // wrapper fields — recursively process nested fields
    if (field.wrapper) {
      result = mergeFieldSelections(
        result,
        fieldDescriptorsToActionSelection(field.wrapper.fields)
      );
      continue;
    }

    // skip non-action fields
    if (!field.action) continue;

    result = mergeFieldSelections(result, {[field.name]: FIELD_DEFAULT});
  }
  return result;
};

export const actionDescriptorsToFieldSelection = (actions: ActionDescriptor[]): FieldSelection => {
  if (actions.length === 0) return {};
  return mergeFieldSelections(...actions.map((action) => ({[action.name]: FIELD_DEFAULT})));
};
