import {merge} from 'lodash-es';
import {SortPayload as RaSortPayload} from 'react-admin';
import {
  ActionDescriptor,
  ActionSchema,
  BoxItem,
  BoxSchema,
  FieldDescriptor,
  FieldSchema,
  FilterDescriptor,
  FilterSchema,
  FiltersConfiguration,
  GlobalResourceSchema,
  ResourceActionSchema,
  SortDescriptor,
} from '@schema/types';
import {DefaultValues} from '@typing';
import {evaluateConditionExpression, getCachedConditionAst} from './conditionExpression';

// The API error helpers live in the admin layer (`@admin/utils/api`) — they belong together and the
// foundation layer intentionally stays API-agnostic. Re-exported here so existing `@schema/utils/api`
// consumers and the public package entry keep working unchanged.
export {extractErrorMessage, handleErrorResponse} from '@admin/utils/api';

// Converts a key to `camelCase`, but only if it is plain `snake_case` to begin with: words of
// letters and digits joined by single underscores. Anything else — a run of two or more
// (`created_at__gte`), a leading or trailing one (`_target`), a space, an accented letter — is not
// a valid key of the schema contract, so it is passed through exactly as it arrived rather than
// rewritten into something neither side recognizes. Leaving it alone is also what stops a crafted
// key such as `____proto____` from being folded onto `__proto__`.
const SNAKE_CASE_WORD = /^[a-zA-Z0-9]+$/;

const toCamelCase = (key: string): string => {
  const words = key.split('_');
  if (!words.every((word) => SNAKE_CASE_WORD.test(word))) return key;
  return words
    .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('');
};

// `result` inherits from `Object.prototype`, where `__proto__` is an accessor, so assigning that key
// would replace the result's prototype with a server-supplied value instead of storing a key — the
// object then reads back properties it does not own. No backend sends this key, so it is dropped.
const UNSAFE_KEY = '__proto__';

// Returns `any` deliberately: this is a generic shape-preserving JSON transformer
// (only object keys are renamed) feeding several concrete schema types, so callers
// rely on the result being assignable to their own type.
export const snakeCaseToCamelCase = (obj: unknown, ignore: string[]): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => snakeCaseToCamelCase(v, ignore));
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const result: {[key: string]: unknown} = {};
  // `Object.entries` rather than `for...in`: only own properties of the input belong in the result.
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelCaseKey = toCamelCase(key);
    if (camelCaseKey === UNSAFE_KEY) continue;
    result[camelCaseKey] = ignore.includes(camelCaseKey)
      ? value
      : snakeCaseToCamelCase(value, ignore);
  }
  return result;
};

export const IGNORED_PARAMS = ['displayedFilters', 'filter', 'order', 'page', 'perPage', 'sort'];

// Parses the expression (throwing `Invalid expression.` on anything outside the supported
// grammar — see `conditionExpression.ts`) and returns an evaluator over the parsed AST. The AST is
// cached per expression string, so calling this repeatedly for the same `showQuery`/`requiredQuery`
// (e.g. once per render) parses with `jsep` only once. No code is ever compiled from the
// expression, so `unsafe-eval` is not needed in the CSP.
export const createConditionFunction = (expression: string) => {
  const ast = getCachedConditionAst(expression);
  return (data: object): boolean => {
    try {
      return evaluateConditionExpression(ast, data);
    } catch {
      return false;
    }
  };
};

export const excludeSchemaChoices = (schema: FieldSchema, choices: (string | number)[]) => {
  // Exclude choices from the schema enum
  if (!schema.enum) return schema;
  const filteredEnum = schema.enum.filter((choice) => !choices.includes(choice.value));
  return {
    ...schema,
    enum: filteredEnum,
  };
};

const MAX_PRIORITY = 1000000;

export const getResourcePriorityList = (schema: GlobalResourceSchema) => {
  const priority: number[] = [];
  let parent = schema.menu?.parent;
  if (parent) {
    while (parent) {
      priority.push(parent.priority);
      parent = parent.parent;
    }
  }
  priority.push(schema.menu?.priority || MAX_PRIORITY);
  return priority;
};

export const generateActionSchemaMap = (
  actions: ResourceActionSchema[]
): Record<string, ResourceActionSchema> => {
  return actions.reduce(
    (acc, action) => {
      acc[action.name] = action;
      return acc;
    },
    {} as Record<string, ResourceActionSchema>
  );
};

export const generateActionSchema = (
  schema: ActionSchema,
  descriptor: ActionDescriptor
): ActionSchema => {
  return {
    ...schema,
    label: descriptor.label || schema.label,
    icon: descriptor.icon || schema.icon,
    color: descriptor.color || schema.color,
    confirmDialog: descriptor.confirmDialog || schema.confirmDialog,
    view: schema.view ? merge({}, schema.view || {}, descriptor.view || {}) : undefined,
  };
};

export const generateFilterSchema = (
  schema: FilterSchema,
  descriptor: FilterDescriptor
): FilterSchema => {
  return {
    ...schema,
    label: descriptor.label || schema.label,
    isAlwaysOn: descriptor.isAlwaysOn ?? schema.isAlwaysOn ?? false,
    defaultValue: descriptor.defaultValue ?? schema.defaultValue,
    helpText: descriptor.helpText || schema.helpText,
    options: merge({}, schema.options || {}, descriptor.options || {}),
  };
};

export const generateFilterSchemas = (
  filters: FilterSchema[],
  descriptors?: FilterDescriptor[]
): FilterSchema[] => {
  const filterDescriptorsToRender = descriptors || filters.map((field) => ({name: field.name}));

  const findFilterSchema = (descriptor: FilterDescriptor) => {
    const filterSchema = filters.find((filter) => filter.name === descriptor.name);

    if (filterSchema) return filterSchema;

    return filters.find((filter) => filter.name.startsWith(`${descriptor.name}__`));
  };

  return (
    filterDescriptorsToRender
      .map((descriptor) => {
        const filterSchema = findFilterSchema(descriptor);
        if (!filterSchema) return;
        return generateFilterSchema(filterSchema, descriptor);
      })
      .filter((filter) => filter !== undefined) as FilterSchema[]
  ).sort((filterA, filterB) => {
    if (filterA.isAlwaysOn === filterB.isAlwaysOn) return 0;
    if (filterA.isAlwaysOn)
      return -1; // toolbar filters are first
    else return 1;
  });
};

export const convertApiSortToRaSort = (apiSort?: SortDescriptor): RaSortPayload => {
  if (!apiSort) return {field: 'id', order: 'ASC'};
  return {
    field: apiSort.fieldName,
    order: apiSort.direction.toUpperCase() as 'ASC' | 'DESC',
  };
};

const RA_ID_NAME = 'id';

// The backend list filter format: `key=<JSON value>` pairs joined by `&`, with the
// React Admin virtual `search_query` filter mapped to the backend `search` key
export const serializeListFilter = (filter: FiltersConfiguration): string | undefined => {
  const {search_query, ...restFilter} = filter;
  const mappedFilter = {
    ...restFilter,
    ...(search_query !== undefined && {search: search_query}),
  };
  const parts = Object.entries(mappedFilter).map(
    ([key, value]) => `${key}=${JSON.stringify(value)}`
  );
  return parts.length > 0 ? parts.join('&') : undefined;
};

export const serializeOrderBy = (schema: GlobalResourceSchema, sort?: RaSortPayload): string => {
  let field = sort?.field;
  if (!field || (field === RA_ID_NAME && schema.pkFieldName !== RA_ID_NAME)) {
    field = schema.pkFieldName;
  }
  return `${field}:${(sort?.order || 'asc').toLowerCase()}`.replace('.', '__');
};

export const parseContentDispositionFilename = (header: string | null): string | undefined => {
  if (!header) return undefined;
  const encodedMatch = header.match(/filename\*=utf-8''([^;]+)/i);
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1].trim());
    } catch {
      // malformed encoding — fall back to the plain filename parameter
    }
  }
  const plainMatch = header.match(/filename="?([^";]+)"?/);
  return plainMatch ? plainMatch[1].trim() : undefined;
};

// maps a FieldSchema to the minimal FieldDescriptor shape consumers (e.g. config-step pickers) need
export const toFieldDescriptor = (f: FieldSchema): FieldDescriptor => ({
  type: 'field',
  name: f.name,
  label: f.label,
  shortLabel: f.shortLabel,
  helpText: f.helpText,
  sortable: f.sortable,
  sortBy: f.sortBy,
  readOnly: f.readOnly,
  writeOnly: f.writeOnly,
  defaultValue: f.defaultValue,
  format: f.format,
  reference: f.reference,
  enum: f.enum,
});

export const isBoxSchema = (item: BoxItem): item is BoxSchema => item.type !== 'field';

export const isFieldDescriptor = (item: BoxItem): item is FieldDescriptor => item.type === 'field';

/**
 * Whether a box holds fields directly, rather than only wrapping other boxes. A box with fields
 * needs the surface those fields sit on, which is what makes it keep the root-box card default
 * instead of handing it down to its children — see `useBoxCard`.
 */
export const hasFieldDescriptors = (boxes: BoxItem[] = []): boolean =>
  boxes.some(isFieldDescriptor);

export const getTopLevelFieldDescriptors = (schema: BoxSchema): FieldDescriptor[] => {
  return (schema.boxes || []).filter(isFieldDescriptor);
};

export const collectFieldDescriptors = (schema: BoxSchema): FieldDescriptor[] => {
  const result: FieldDescriptor[] = [];

  const expandDescriptor = (descriptor: FieldDescriptor) => {
    if (descriptor.wrapper) {
      descriptor.wrapper.fields.forEach(expandDescriptor);
    } else {
      result.push(descriptor);
    }
  };

  schema.boxes?.forEach((boxItem) => {
    if (isFieldDescriptor(boxItem)) {
      expandDescriptor(boxItem);
      return;
    }
    if (boxItem.type === 'list') return;
    if (boxItem.type === 'array') {
      if (boxItem.array?.target) result.push({type: 'field', name: boxItem.array.target});
      return;
    }
    if (boxItem.type === 'object') {
      if (boxItem.object?.target) result.push({type: 'field', name: boxItem.object.target});
      return;
    }
    result.push(...collectFieldDescriptors(boxItem));
  });

  return result;
};

export const buildBoxDefaultValues = (
  box: BoxSchema,
  fieldSchemas: FieldSchema[],
  fallbackValue?: unknown
): DefaultValues => {
  const defaults: DefaultValues = {};

  collectFieldDescriptors(box).forEach((descriptor) => {
    const field = fieldSchemas.find((f) => f.name === descriptor.name);
    const defaultValue =
      descriptor.defaultValue !== undefined ? descriptor.defaultValue : field?.defaultValue;
    if (defaultValue !== undefined) {
      defaults[descriptor.name] = defaultValue;
    } else if (fallbackValue !== undefined) {
      defaults[descriptor.name] = fallbackValue;
    }
  });

  const collectNestedObjectDefaults = (item: BoxItem) => {
    if (isFieldDescriptor(item)) return;
    if (item.type === 'object' && item.object?.target) {
      const target = item.object.target;
      const targetSchema = fieldSchemas.find((f) => f.name === target);
      const properties = targetSchema?.properties;
      if (!properties || !targetSchema || targetSchema.nullable) return;
      defaults[target] = buildBoxDefaultValues(item, properties);
    } else if (item.type !== 'array' && item.type !== 'list') {
      item.boxes?.forEach(collectNestedObjectDefaults);
    }
  };

  box.boxes?.forEach(collectNestedObjectDefaults);

  return defaults;
};

export const VIEW_DATA_IGNORED_KEYS = ['_target'];

export const getFormData = (
  base: Record<string, unknown>,
  viewData: Record<string, unknown> | undefined
): Record<string, unknown> => {
  const viewFormData = Object.fromEntries(
    Object.entries(viewData || {}).filter(([key]) => !VIEW_DATA_IGNORED_KEYS.includes(key))
  );
  return {...base, ...viewFormData};
};

/** The `_target` query value parsed, or undefined when it is absent or not valid JSON. */
export const getTargetValues = (data: Record<string, string | number | boolean> | undefined) => {
  const raw = data?._target;
  if (typeof raw !== 'string' || !raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};
