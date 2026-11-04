import {useResourceContext as useRaResourceContext} from 'react-admin';

// `resource` is a full "service/resource" key; without one the surrounding context's applies.
export const useResourceContext = (resource?: string): string => {
  const context = useRaResourceContext({resource});
  if (!context) {
    throw new Error(
      'Resource context is undefined. Make sure to call useResourceContext within a ResourceContext provider.'
    );
  }
  return context;
};
