import {Identifier} from 'react-admin';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {ChangeViewProps} from '@schema/contexts/SchemaViewRouterContext/types';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';

type RedirectDefault = (id: Identifier) => ChangeViewProps | undefined;

export const useAfterSaveRedirect = ({
  hasShowView,
  hasListView,
  redirectDefault,
}: {
  hasShowView: boolean;
  hasListView: boolean;
  redirectDefault: RedirectDefault;
}) => {
  const {viewSchema} = useViewSchemaContext();
  const resource = useResourceContext();
  const {prevView, changeView} = useSchemaViewRouterContext();

  const afterSave = viewSchema.detail?.bottomActions?.find((d) => d.action?.type === 'save')?.action
    ?.save?.afterSave;

  // `replace` tells a caller standing in for this redirect (a trigger action that navigates itself)
  // whether the redirect would have replaced the current history entry, so it can do the same.
  const getRedirect = (id: Identifier): {redirect: () => void; replace: boolean} => {
    const redirectShow: ChangeViewProps = {
      resource,
      viewName: 'show',
      viewType: 'show',
      id,
      replace: true,
    };
    const redirectList: ChangeViewProps = {
      resource,
      viewName: 'list',
      viewType: 'list',
      replace: true,
    };

    let redirectData: ChangeViewProps | undefined;
    switch (afterSave) {
      case 'show':
        redirectData = hasShowView ? redirectShow : redirectDefault(id);
        break;
      case 'list':
        redirectData = hasListView ? redirectList : redirectDefault(id);
        break;
      case 'prev':
        redirectData = prevView() ? undefined : redirectDefault(id);
        break;
      case 'stay':
        redirectData = undefined;
        break;
      default:
        redirectData = redirectDefault(id);
    }

    return {
      redirect: () => {
        if (redirectData) changeView(redirectData);
      },
      replace: !!redirectData?.replace,
    };
  };

  return {getRedirect};
};
