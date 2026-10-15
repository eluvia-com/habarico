import {useDynamicShowData} from '@schema/components/dynamic/hooks/useDynamicShowData';
import {createConditionFunction} from '@schema/utils/api';
import {DynamicWrapperRenderProps} from './types';

export const ShowDynamicRenderWrapper = ({
  showQuery,
  children,
  hiddenEl,
}: DynamicWrapperRenderProps) => {
  const data = useDynamicShowData();
  return createConditionFunction(showQuery)(data) ? children : hiddenEl;
};
