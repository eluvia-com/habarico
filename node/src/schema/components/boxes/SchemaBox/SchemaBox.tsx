import React from 'react';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {DynamicRenderWrapper} from '@schema/components/dynamic/DynamicRenderWrapper';
import {SchemaBoxBody} from './SchemaBoxBody';

/**
 * Renders a box schema through the box provider and hides it while its
 * `options.dynamicRender.showQuery` is false. A container that owns the box's slot evaluates the
 * query itself and renders `SchemaBoxBody` instead.
 */
export const SchemaBox = (props: SchemaBoxProps) => (
  <DynamicRenderWrapper showQuery={props.schema.options?.dynamicRender?.showQuery}>
    <SchemaBoxBody {...props} />
  </DynamicRenderWrapper>
);
