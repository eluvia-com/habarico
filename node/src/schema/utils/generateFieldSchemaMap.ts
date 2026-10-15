import {merge} from 'lodash-es';
import {FieldDescriptor, FieldSchema, FieldSchemaMap} from '@schema/types';

function buildFieldSchemaOverrides(
  fieldDescriptor: FieldDescriptor,
  fieldSchema: FieldSchema,
  name: string
) {
  return {
    name,
    label: fieldDescriptor.label ?? fieldSchema.label,
    helpText: fieldDescriptor.helpText ?? fieldSchema.helpText,
    shortLabel: fieldDescriptor.shortLabel ?? fieldSchema.shortLabel,
    sortBy: fieldDescriptor.sortBy ?? fieldSchema.sortBy,
    sortable: fieldDescriptor.sortable ?? fieldSchema.sortable,
    options: merge({}, fieldSchema.options ?? {}, fieldDescriptor.options ?? {}),
    defaultValue: fieldDescriptor.defaultValue ?? fieldSchema.defaultValue,
  };
}

export function generateFieldSchemaMap(
  fieldSchemas: FieldSchema[],
  fieldDescriptors?: FieldDescriptor[]
) {
  const fieldDescriptorsToRender: FieldDescriptor[] =
    fieldDescriptors || fieldSchemas.map((field) => ({type: 'field' as const, name: field.name}));

  const findSchema = (
    fields: FieldSchema[],
    fieldDescriptor: FieldDescriptor,
    sourcePrefix: string | undefined
  ): FieldSchema | undefined => {
    if (fieldDescriptor.name.includes('__')) {
      const [first, ...rest] = fieldDescriptor.name.split('__');
      const fieldSchema = fields.find((field) => field.name === first);
      const prefixedName = sourcePrefix ? `${sourcePrefix}.${first}` : first;

      if (fieldSchema && fieldSchema.format === 'relation') {
        return {
          ...fieldSchema,
          ...buildFieldSchemaOverrides(fieldDescriptor, fieldSchema, prefixedName),
          readOnly: true,
          targetSource: rest.join('__'),
        };
      }
      if (!fieldSchema || !fieldSchema.properties) return;
      return findSchema(
        fieldSchema.properties,
        {
          type: 'field',
          name: rest.join('__'),
          label: fieldDescriptor.label,
          shortLabel: fieldDescriptor.shortLabel,
          helpText: fieldDescriptor.helpText,
          sortable: fieldDescriptor.sortable,
          sortBy: fieldDescriptor.sortBy,
          defaultValue: fieldDescriptor.defaultValue,
        },
        prefixedName
      );
    }
    const fieldSchema = fields.find((field) => field.name === fieldDescriptor.name);
    if (!fieldSchema) return;
    const prefixedName = sourcePrefix
      ? `${sourcePrefix}.${fieldDescriptor.name}`
      : fieldDescriptor.name;

    return {
      ...fieldSchema,
      ...buildFieldSchemaOverrides(fieldDescriptor, fieldSchema, prefixedName),
      sortable: !!fieldSchema.sortable && sourcePrefix === '' && fieldDescriptor.sortable !== false,
      readOnly: fieldSchema.readOnly || sourcePrefix !== '' || !!fieldDescriptor.readOnly,
    };
  };

  const fieldSchemaMap: FieldSchemaMap = {};
  fieldDescriptorsToRender.forEach((fieldDescriptor) => {
    const generatedFieldSchema = findSchema(fieldSchemas, fieldDescriptor, '');
    if (generatedFieldSchema) {
      fieldSchemaMap[fieldDescriptor.name] = generatedFieldSchema;
    }
  });

  return fieldSchemaMap;
}
