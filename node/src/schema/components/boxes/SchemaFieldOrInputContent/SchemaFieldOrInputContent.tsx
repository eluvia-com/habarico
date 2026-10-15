import React from 'react';
import {InputProps} from '@admin/components/inputs/types';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {SchemaFieldBody} from '@schema/components/fields/SchemaField';
import {SchemaInputBody} from '@schema/components/inputs/SchemaInput';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {FieldSchema} from '@schema/types';

type SchemaInputProps = InputProps & {
  schema: FieldSchema;
  showLabel?: boolean;
};

/**
 * The value of a field slot — its display field in a read-only context, else its input — without
 * evaluating `dynamicRender.showQuery`: the caller owns the slot (a `PropertyItem` row, a datagrid
 * cell) and hides it as a whole.
 */
export const SchemaFieldOrInputContent = ({schema, ...props}: SchemaInputProps) => {
  const {readOnly: readOnlyView} = useViewSchemaContext();
  const {isInCollection} = useValueLocationContext();
  const readOnly = readOnlyView || schema.readOnly || isInCollection;

  if (readOnly) {
    return <SchemaFieldBody schema={schema} {...props} />;
  } else {
    return <SchemaInputBody schema={schema} {...props} />;
  }
};
