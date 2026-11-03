import React from 'react';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {ReadOnlyBoxProvider, useIsReadOnly} from '@schema/contexts/ReadOnlyBoxContext';
import {SchemaReadonlyObjectBox} from './SchemaReadonlyObjectBox';
import {SchemaWriteableObjectBox} from './SchemaWriteableObjectBox';

export const SchemaObjectBox = ({schema, label, isRoot}: SchemaBoxProps) => {
  const fieldSchemas = useFieldSchemaMapContext();
  const readOnlyScope = useIsReadOnly();
  const targetFieldSchema = fieldSchemas[schema.object?.target || ''];

  if (!schema.object?.target || !targetFieldSchema || !targetFieldSchema.properties) return;
  // Same three sources as the array box — see `SchemaArrayBox`.
  const readOnly = readOnlyScope || Boolean(schema.readOnly) || Boolean(targetFieldSchema.readOnly);

  if (readOnly) {
    // Scoped, not just routed: the read-only variant renders the object's properties through the
    // ordinary box children, which would otherwise render inputs when only the *field* is read-only
    // and the box itself carries no flag for `SchemaBoxBody` to pick up.
    return (
      <ReadOnlyBoxProvider readOnly>
        <SchemaReadonlyObjectBox schema={schema} label={label} isRoot={isRoot} />
      </ReadOnlyBoxProvider>
    );
  } else {
    return <SchemaWriteableObjectBox schema={schema} label={label} isRoot={isRoot} />;
  }
};
