import React from 'react';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {SchemaReadonlyObjectBox} from './SchemaReadonlyObjectBox';
import {SchemaWriteableObjectBox} from './SchemaWriteableObjectBox';

export const SchemaObjectBox = ({schema, label, isRoot}: SchemaBoxProps) => {
  const fieldSchemas = useFieldSchemaMapContext();
  const {readOnly: readOnlyView} = useViewSchemaContext();
  const targetFieldSchema = fieldSchemas[schema.object?.target || ''];

  if (!schema.object?.target || !targetFieldSchema || !targetFieldSchema.properties) return;
  const readOnly = readOnlyView || targetFieldSchema.readOnly;

  if (readOnly) {
    return <SchemaReadonlyObjectBox schema={schema} label={label} isRoot={isRoot} />;
  } else {
    return <SchemaWriteableObjectBox schema={schema} label={label} isRoot={isRoot} />;
  }
};
