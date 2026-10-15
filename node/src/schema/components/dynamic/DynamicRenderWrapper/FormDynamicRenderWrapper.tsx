import {useDynamicFormData} from '@schema/components/dynamic/hooks/useDynamicFormData';
import {createConditionFunction} from '@schema/utils/api';
import {DynamicWrapperRenderProps} from './types';

export const FormDynamicRenderWrapper = ({
  showQuery,
  children,
  hiddenEl,
}: DynamicWrapperRenderProps) => {
  const data = useDynamicFormData([showQuery]);
  return createConditionFunction(showQuery)(data) ? children : hiddenEl;
};
