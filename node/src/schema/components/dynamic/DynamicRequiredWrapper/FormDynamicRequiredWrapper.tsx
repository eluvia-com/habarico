import React from 'react';
import {useDynamicFormData} from '@schema/components/dynamic/hooks/useDynamicFormData';
import {createConditionFunction} from '@schema/utils/api';
import {DynamicRequiredWrapperRenderProps} from './types';

export const FormDynamicRequiredWrapper = ({
  requiredQuery,
  children,
}: DynamicRequiredWrapperRenderProps) => {
  const data = useDynamicFormData([requiredQuery]);
  return createConditionFunction(requiredQuery)(data)
    ? React.cloneElement(children, {isRequired: true})
    : children;
};
