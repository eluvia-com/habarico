import {ReactElement} from 'react';
import {ResourceProps} from 'react-admin';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {getResourcePriorityList} from '@schema/utils/api';
import {useGetResourceRouterElement} from '../useGetResourceRouterElement';

type ResourceWithPriority = {
  element: ReactElement<ResourceProps>;
  priority: number[];
};

export const useResourceElements = () => {
  const {servicesSchema} = useSchemaRootContext();
  const getResourceRouterElement = useGetResourceRouterElement();
  const generatedResources: ResourceWithPriority[] = [];
  for (const serviceName in servicesSchema) {
    for (const resourceSchema of servicesSchema[serviceName]) {
      const fullResourceName = serviceName + '/' + resourceSchema.name;
      const resourceElement = getResourceRouterElement(fullResourceName);
      if (resourceElement) {
        generatedResources.push({
          element: resourceElement,
          priority: getResourcePriorityList(resourceSchema),
        });
      }
    }
  }

  // Sort resources by priority and return the elements
  // Resources must be sorted by priority to select the right root resource if dashboard is not set
  return generatedResources
    .sort((a, b) => {
      const [pa, pb] = [a.priority, b.priority];
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        if (pa[i] !== pb[i]) return pa[i] - pb[i];
      }
      return 0;
    })
    .map((generatedResource) => {
      return generatedResource.element;
    });
};
