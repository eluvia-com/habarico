import React from 'react';
import {FieldProps} from '@admin/components/fields/types';
import {SchemaArrayBox} from '@schema/components/boxes/SchemaArrayBox';
import {BoxSchema, FieldSchema, ItemFieldSchema} from '@schema/types';

export type SchemaObjectArrayFieldProps = FieldProps & {
  items: ItemFieldSchema | FieldSchema;
};

export const SchemaObjectArrayField = ({source, label, items}: SchemaObjectArrayFieldProps) => {
  const sourceParts = source.split('.');
  const target = sourceParts[sourceParts.length - 1];

  if (!items.properties || !Array.isArray(items.properties)) {
    return;
  }

  const arrayBoxSchema: BoxSchema = {
    name: `field__${source}`,
    array: {target},
    label: String(label),
    type: 'array',
    boxes: items.properties.map((field) => ({type: 'field' as const, name: field.name})),
    readOnly: false,
  };

  return <SchemaArrayBox schema={arrayBoxSchema} label={label} />;
};
