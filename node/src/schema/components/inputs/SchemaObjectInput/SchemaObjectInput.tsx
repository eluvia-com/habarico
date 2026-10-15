import React from 'react';
import {InputProps} from '@admin/components/inputs/types';
import {SchemaObjectBox} from '@schema/components/boxes/SchemaObjectBox';
import {BoxSchema, FieldSchema} from '@schema/types';

export type SchemaObjectInputProps = InputProps & {
  defaultValue?: unknown;
  fields: FieldSchema[];
};

export const SchemaObjectInput = ({source = '', label, fields}: SchemaObjectInputProps) => {
  const sourceParts = source.split('.');
  const target = sourceParts[sourceParts.length - 1];

  const boxSchema: BoxSchema = {
    name: `field__${source}`,
    object: {
      target,
    },
    label: String(label),
    type: 'object',
    boxes: fields.map((field) => ({type: 'field' as const, name: field.name!})),
    readOnly: true,
  };

  return <SchemaObjectBox schema={boxSchema} label={label} />;
};
