import React from 'react';
import {useDynamicShowData} from '@schema/components/dynamic/hooks/useDynamicShowData';
import {BoxSchema} from '@schema/types';
import {createConditionFunction, isBoxSchema} from '@schema/utils/api';
import {DynamicBoxSchemaComponentWrapperProps} from './types';

/**
 * A wrapper component that dynamically renders boxe component based on conditions.
 */
export const ShowDynamicBoxSchemaComponentWrapper = ({
  schema,
  component,
  ...props
}: DynamicBoxSchemaComponentWrapperProps) => {
  const data = useDynamicShowData();

  const showBox = (box: BoxSchema) => {
    const dynamicRenderQuery = box.options?.dynamicRender?.showQuery;

    return !dynamicRenderQuery || createConditionFunction(dynamicRenderQuery)(data);
  };

  const boxes = (schema.boxes || []).filter((box) => isBoxSchema(box) && showBox(box as BoxSchema));

  const componentSchema = {...schema, boxes};

  return React.createElement(component, {...props, schema: componentSchema});
};
