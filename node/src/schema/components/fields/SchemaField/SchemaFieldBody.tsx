import React from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {FieldProps} from '@admin/components/fields/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {useGetField} from '@schema/contexts/ResourceFieldContext/useGetField';
import {SchemaFieldContent} from '../SchemaFieldContent';
import type {SchemaFieldProps} from './SchemaField';

/**
 * `SchemaField` without its own `showQuery` check, for a component that owns the slot the field
 * sits in and evaluates the query itself (`SchemaPropertyItem`, `SchemaFieldOrInput`).
 */
export const SchemaFieldBody = ({
  schema,
  source = schema.name,
  label = schema.label,
  showLabel = true,
  emptyText = '--',
  textAlign,
}: SchemaFieldProps) => {
  const getFieldEl = useGetField();
  const resource = useResourceContext();
  const {isInCollection} = useValueLocationContext();
  const rootSource = source?.split('.').slice(0, -1).join('.');

  // `showLabel={false}` (e.g. a value slot owned by `SchemaPropertyItem`'s `PropertyItem`) must
  // reach the field element as `label={false}`, not just skip `SchemaFieldContent`'s own
  // `Labeled` wrap below — fields that self-label for targetSource relations
  // (`SchemaReferenceField`) read this `label` prop to decide whether to render their own
  // `Labeled`, and would otherwise duplicate the label the box already renders.
  const labelEl =
    showLabel && label ? <DynamicText source={rootSource}>{label}</DynamicText> : false;

  const fieldProps: FieldProps = {
    source,
    label: labelEl,
    emptyText: emptyText,
    textAlign,
  };
  const fieldEl = getFieldEl({
    resource,
    source,
    type: schema.type,
    isInList: isInCollection,
    format: schema.format,
    schema,
    props: fieldProps,
  });
  if (!fieldEl) return;

  return (
    <SchemaFieldContent source={source} schema={schema} showLabel={showLabel} textAlign={textAlign}>
      {fieldEl}
    </SchemaFieldContent>
  );
};
