import React from 'react';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {isBoxSchema} from '@schema/utils/api';
import {FormDynamicBoxSchemaComponentWrapper} from './FormDynamicBoxSchemaComponentWrapper';
import {ShowDynamicBoxSchemaComponentWrapper} from './ShowDynamicBoxSchemaComponentWrapper';
import {DynamicBoxSchemaComponentWrapperProps} from './types';

/**
 * A wrapper component that dynamically renders boxe component based on conditions.
 * The child boxes are filtered according to their `dynamicRender.showQuery` conditions, which are evaluated against the current record data and view data.
 */
export const DynamicBoxSchemaComponentWrapper = ({
  schema,
  component,
  ...props
}: DynamicBoxSchemaComponentWrapperProps) => {
  const {readOnly} = useViewSchemaContext();

  const areTabsDynamic = schema.boxes?.some(
    (box) => isBoxSchema(box) && box.options?.dynamicRender?.showQuery !== undefined
  );

  if (!areTabsDynamic) {
    return React.createElement(component, {...props, schema: schema});
  } else if (readOnly) {
    return (
      <ShowDynamicBoxSchemaComponentWrapper component={component} schema={schema} {...props} />
    );
  } else {
    return (
      <FormDynamicBoxSchemaComponentWrapper component={component} schema={schema} {...props} />
    );
  }
};
