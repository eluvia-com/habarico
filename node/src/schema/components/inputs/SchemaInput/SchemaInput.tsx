import React from 'react';
import {DynamicRenderWrapper} from '@schema/components/dynamic/DynamicRenderWrapper';
import {SchemaInputProps} from '@schema/components/inputs/types';
import {SchemaInputBody} from './SchemaInputBody';

/**
 * Renders the input for a field schema and hides it (`hiddenEl` in its place, or nothing) while its
 * `options.dynamicRender.showQuery` is false. Inside a layout that owns the input's slot, the layout
 * evaluates the query and renders `SchemaInputBody` instead.
 */
export const SchemaInput = ({hiddenEl, ...props}: SchemaInputProps) => (
  <DynamicRenderWrapper
    showQuery={props.schema.options?.dynamicRender?.showQuery}
    hiddenEl={hiddenEl}
  >
    <SchemaInputBody {...props} />
  </DynamicRenderWrapper>
);
