import {useCallback} from 'react';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {resourceOfKey, serviceOfKey} from '@schema/utils/resourceReference';

export const useGetGlobalResourceSchema = () => {
  const {servicesSchema} = useSchemaRootContext();

  return useCallback(
    (resource: string) => {
      const serviceName = serviceOfKey(resource);
      const resourceName = resourceOfKey(resource);
      if (serviceName && resourceName) {
        return servicesSchema[serviceName]?.find((r) => r.name === resourceName);
      }
    },
    [servicesSchema]
  );
};
