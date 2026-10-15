import {GlobalViewSchema} from '@schema/types';
import {useGetGlobalResourceSchema} from '../useGetGlobalResourceSchema';

export const useGetGlobalResourceSchemaContext = () => {
  const getGlobalResourceSchema = useGetGlobalResourceSchema();

  return (reference?: string) => {
    const schema = reference ? getGlobalResourceSchema(reference) : undefined;

    const getGlobalViewSchema = (viewName?: string): undefined | GlobalViewSchema => {
      if (!viewName) return;
      return schema?.views?.find((view) => view.name === viewName);
    };

    const hasListView = schema?.views?.some((v) => v.name === 'list') ?? false;
    const hasCreateView = schema?.views?.some((v) => v.name === 'create') ?? false;
    const hasEditView = schema?.views?.some((v) => v.name === 'edit') ?? false;
    const hasShowView = schema?.views?.some((v) => v.name === 'show') ?? false;

    const hasListAction =
      schema?.actions?.some((a) => a.type === 'view' && a.name === 'list') ?? false;
    const hasCreateAction =
      schema?.actions?.some((a) => a.type === 'view' && a.name === 'create') ?? false;
    const hasEditAction =
      schema?.actions?.some((a) => a.type === 'view' && a.name === 'edit') ?? false;
    const hasShowAction =
      schema?.actions?.some((a) => a.type === 'view' && a.name === 'show') ?? false;

    const hasDeleteAction = schema?.actions?.some((a) => a.name === 'delete') ?? false;

    return {
      schema,
      getGlobalViewSchema,
      hasListView,
      hasCreateView,
      hasEditView,
      hasShowView,
      hasListAction,
      hasCreateAction,
      hasEditAction,
      hasShowAction,
      hasDeleteAction,
    };
  };
};
