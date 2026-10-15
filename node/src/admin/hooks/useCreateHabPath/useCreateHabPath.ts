import {useCallback} from 'react';
import {CreatePathParams, removeDoubleSlashes, useBasename, useCreatePath} from 'react-admin';
import {RESERVED_VIEW_TYPES, ReservedViewType} from '@admin/types';

type HabCreatePathParams = CreatePathParams & {
  actionName?: string;
};

const isReservedViewType = (type: CreatePathParams['type']): type is ReservedViewType =>
  (RESERVED_VIEW_TYPES as readonly string[]).includes(type as string);

export const useCreateHabPath = () => {
  const createPath = useCreatePath();
  const basename = useBasename();

  return useCallback(
    ({resource, id, type, actionName}: HabCreatePathParams) => {
      // Route purely on `type`: reserved views use the react-admin route, everything
      // else uses the /a/{action_name} route. `action_name` says what to call, not how
      // to route, so a stray action_name on a reserved view no longer changes the URL.
      if (isReservedViewType(type)) {
        return createPath({resource, id, type});
      }

      let path = removeDoubleSlashes(`${basename}/${resource}`);
      if (id) {
        path = `${path}/${encodeURIComponent(id)}`;
      }
      return `${path}/a/${actionName}`;
    },
    [createPath, basename]
  );
};
