import React from 'react';
import {FieldProps} from '@admin/components/fields/types';
import {DynamicRenderWrapper} from '@schema/components/dynamic/DynamicRenderWrapper';
import {FieldSchema} from '@schema/types';
import {SchemaFieldBody} from './SchemaFieldBody';

export type SchemaFieldProps = Omit<FieldProps, 'label,schema'> & {
  schema: FieldSchema;
  showLabel?: boolean;
  source?: string;
  maxWidth?: number;
};

/**
 * Renders the display field for a field schema and hides it while its
 * `options.dynamicRender.showQuery` is false. Inside a layout that owns the field's slot, the layout
 * evaluates the query and renders `SchemaFieldBody` instead.
 */
export const SchemaField = (props: SchemaFieldProps) => (
  <DynamicRenderWrapper showQuery={props.schema.options?.dynamicRender?.showQuery}>
    <SchemaFieldBody {...props} />
  </DynamicRenderWrapper>
);
