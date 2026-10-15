import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useGetGlobalResourceSchemaContext} from '../useGetGlobalResourceSchemaContext';

export const useGlobalResourceSchemaContext = (resource?: string) => {
  const reference = useResourceContext(resource);
  const getGlobalResourceSchemaContext = useGetGlobalResourceSchemaContext();
  return getGlobalResourceSchemaContext(reference);
};
