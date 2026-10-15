import {createContext, useCallback, useContext, useMemo} from 'react';
import {useResourceContext as useRaResourceContext} from 'react-admin';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useGetLinkWithData} from '@admin/hooks/useGetLinkWithData';
import {useRecordIdOrUndefined} from '@admin/hooks/useRecordIdOrUndefined';
import {ViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {IGNORED_PARAMS} from '@schema/utils/api';
import {ChangeViewProps, SchemaViewRouterContextState, SchemaViewRouterContextType} from './types';

export const SchemaViewRouterContext = createContext<SchemaViewRouterContextState | undefined>(
  undefined
);

export function useSchemaViewRouterContext() {
  const rootResource = useRaResourceContext();
  const rootRecordId = useRecordIdOrUndefined();

  const [searchParams] = useSearchParams();
  const schemaViewResourceContext = useContext(SchemaViewRouterContext);
  const navigate = useNavigate();

  const context = useContext(ViewSchemaContext);

  const {resource = rootResource, recordId = rootRecordId} = context || {};

  const getLink = useGetLinkWithData(resource);

  const getViewLink = useCallback(
    ({resource, actionName, viewType, id, data}: ChangeViewProps) => {
      return getLink({type: viewType, actionName, resource, id, params: data});
    },
    [getLink]
  );

  const changeView = useCallback(
    ({replace, ...props}: ChangeViewProps) => {
      const link = getViewLink(props);
      if (link) {
        navigate(link, {replace: !!replace});
        return true;
      }
      return false;
    },
    [navigate, getViewLink]
  );

  const prevView = useCallback(() => {
    const prevLink = getLink({type: 'prev', resource: resource});
    if (prevLink) {
      navigate(prevLink);
      return true;
    }
    return false;
  }, [navigate, getLink, resource]);

  const viewData = useMemo(() => {
    return Object.fromEntries(
      Array.from(searchParams.entries()).filter(([key]) => !IGNORED_PARAMS.includes(key))
    ) as Record<string, string>;
  }, [searchParams]);

  if (schemaViewResourceContext) {
    return {
      ...schemaViewResourceContext,
      getViewLink,
      // A provider describes where we are; saying how to move is optional (`SchemaViewRouterContextProps`
      // leaves both navigations out), so fill the gaps with the routed navigation instead of handing
      // callers a possibly-undefined function. Spreading first and defaulting here also covers the
      // key being present *and* undefined, which a trailing spread would let overwrite the fallback.
      changeView: schemaViewResourceContext.changeView ?? changeView,
      prevView: schemaViewResourceContext.prevView ?? prevView,
    };
  }

  return {
    resource,
    data: viewData,
    changeView,
    prevView,
    getViewLink,
    id: recordId,
  } as SchemaViewRouterContextType;
}
