import {SortPayload} from 'react-admin';
import {DEFAULT_SORT} from '@admin/constants';
import {useCreateHabPath} from '@admin/hooks/useCreateHabPath';
import {useGetLocalResourceSchema} from '@schema/hooks/useGetLocalResourceSchema';
import {FiltersConfiguration} from '@schema/types';

type UseListHrefParams = {
  resource?: string;
  filters?: FiltersConfiguration;
  sort?: SortPayload;
};

// Builds an href to a resource's list view, carrying sort + filters as query params. Returns
// undefined when there is no resource, or the resource has no list view (e.g. custom widgets).
export const useListHref = ({resource, filters, sort}: UseListHrefParams): string | undefined => {
  const createPath = useCreateHabPath();
  const {schema} = useGetLocalResourceSchema({resource});

  if (!resource || !schema?.views.some((v) => v.type === 'list')) return undefined;

  const effectiveSort = sort ?? DEFAULT_SORT;
  const filterValues = filters ?? {};

  const basePath = createPath({resource, type: 'list'});
  const params = new URLSearchParams({sort: effectiveSort.field, order: effectiveSort.order});
  if (Object.keys(filterValues).length > 0) {
    params.set('filter', JSON.stringify(filterValues));
  }
  return `${basePath}?${params.toString()}`;
};
