import React from 'react';
import {FieldProps} from '@admin/components/fields/types';
import {SchemaObjectBox} from '@schema/components/boxes/SchemaObjectBox';
import {BoxSchema, FieldSchema} from '@schema/types';

export type SchemaObjectFieldProps = FieldProps & {
  fields: FieldSchema[];
};

export const SchemaObjectField = ({source, label, fields}: SchemaObjectFieldProps) => {
  const sourceParts = source.split('.');

  const target = sourceParts[sourceParts.length - 1];

  const boxSchema: BoxSchema = {
    name: `field__${source}`,
    object: {target},
    label: String(label),
    type: 'object',
    boxes: fields.map((field) => ({type: 'field' as const, name: field.name})),
    readOnly: false,
  };

  return <SchemaObjectBox schema={boxSchema} label={label} />;
};
