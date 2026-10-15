import {useCallback} from 'react';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';

export const useGetGlobalResourceSchema = () => {
  const {servicesSchema} = useSchemaRootContext();

  return useCallback(
    (resource: string) => {
      const [serviceName, resourceName] = resource.split('/');
      if (serviceName && resourceName) {
        return servicesSchema[serviceName]?.find((r) => r.name === resourceName);
      }
    },
    [servicesSchema]
  );
};
