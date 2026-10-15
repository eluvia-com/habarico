import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {getTargetValues} from '@schema/utils/api';

export const useGetTargetValues = () => {
  const {data: viewData} = useSchemaViewRouterContext();
  const parentDescriptors = useParentResourceDescriptorsContext();
  const lastParentDescriptorWithTarget = parentDescriptors?.findLast(
    (descriptor) => descriptor.target
  );

  let targetValues = getTargetValues(viewData);
  if (!targetValues && lastParentDescriptorWithTarget && lastParentDescriptorWithTarget.target) {
    targetValues = {
      [lastParentDescriptorWithTarget.target]: lastParentDescriptorWithTarget.recordId,
    };
  }

  return targetValues;
};
