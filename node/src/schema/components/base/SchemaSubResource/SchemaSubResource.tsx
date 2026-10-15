import React, {useMemo} from 'react';
import {useParams} from 'react-router-dom';
import {NotFound} from '@admin/components/common/NotFound';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {ParentResourceDescriptorsProvider} from '@schema/contexts/ParentResourceDescriptorsContext';
import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {useGetResourceRouterElement} from '@schema/hooks/useGetResourceRouterElement';

export const SchemaSubResource = () => {
  const params = useParams();
  const parentDescriptors = useParentResourceDescriptorsContext();
  const parentResource = useResourceContext();
  const {serviceName, resourceName, id, target} = params;
  const getResourceRouterElement = useGetResourceRouterElement();

  const resource = `${serviceName}/${resourceName}`;

  const resourceElement = getResourceRouterElement(resource);

  // Memoized: `ParentResourceDescriptorsProvider` doesn't memoize its own `value` — a fresh array
  // here on every render would invalidate the context for every descendant regardless of whether
  // the descriptors changed. Placed before the early return below since a hook can't sit after one.
  const parentResourceDescriptorsValue = useMemo(
    () => [...parentDescriptors, {resource: parentResource as string, recordId: id, target}],
    [parentDescriptors, parentResource, id, target]
  );

  // If the resource element is not found, then show a 404 error
  if (!resourceElement) return <NotFound />;

  return (
    <ParentResourceDescriptorsProvider value={parentResourceDescriptorsValue}>
      {resourceElement}
    </ParentResourceDescriptorsProvider>
  );
};
