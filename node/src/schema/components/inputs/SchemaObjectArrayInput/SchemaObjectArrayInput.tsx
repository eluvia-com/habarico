import React from 'react';
import {InputProps} from '@admin/components/inputs/types';
import {SchemaArrayBox} from '@schema/components/boxes/SchemaArrayBox';
import {BoxSchema, FieldSchema, ItemFieldSchema} from '@schema/types';

export type SchemaObjectArrayInputProps = InputProps & {
  items: ItemFieldSchema | FieldSchema;
};

export const SchemaObjectArrayInput = ({
  source = '',
  label,
  items,
}: SchemaObjectArrayInputProps) => {
  const sourceParts = source.split('.');
  const target = sourceParts[sourceParts.length - 1];

  const arrayBoxSchema: BoxSchema = {
    name: `field__${source}`,
    array: {
      target,
    },
    label: String(label),
    type: 'array',
    boxes: items!.properties!.map((field) => ({type: 'field' as const, name: field.name!})),
    readOnly: true,
  };

  return <SchemaArrayBox schema={arrayBoxSchema} label={label} />;
};
