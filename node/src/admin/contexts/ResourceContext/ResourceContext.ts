import {useResourceContext as useRaResourceContext} from 'react-admin';

// Normalizes a `reference` to a full "service/resource" key the data provider understands: a
// bare reference (same service) is prefixed with the owning resource's service, a reference that
// already includes a slash is used as-is. Pure string helper — no schema data involved.
const resolveReferenceResource = (
  reference: string | undefined,
  resource: string
): string | undefined => {
  if (!reference) return undefined;
  if (reference.includes('/')) return reference;
  const service = resource.split('/')[0];
  return service ? `${service}/${reference}` : reference;
};

export const useResourceContextOrUndefined = (resource?: string): string | undefined => {
  const currentResource = useRaResourceContext();

  if (!currentResource && !resource) {
    return undefined;
  }

  if (resource && !currentResource) return resource;
  if (!currentResource) return undefined;
  // no explicit resource → use the context's own; otherwise normalize it against the context
  if (!resource) return currentResource;
  return resolveReferenceResource(resource, currentResource);
};

export const useResourceContext = (resource?: string): string => {
  const context = useResourceContextOrUndefined(resource);
  if (!context) {
    throw new Error(
      'Resource context is undefined. Make sure to call useResourceContext within a ResourceContext provider.'
    );
  }
  return context;
};
