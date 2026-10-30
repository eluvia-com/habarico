import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {FieldDefaults, ViewType} from '@schema/types';
import {
  getViewWithProviders,
  hasViewProp,
  isResourceElement,
} from '@schema/utils/resourceRouterHelpers';
import {useGetGlobalResourceSchema} from '../useGetGlobalResourceSchema';

export const useGetResourceViewElement = () => {
  const {resources, defaultViewProvider} = useSchemaRootContext();
  const getResourceSchema = useGetGlobalResourceSchema();
  return (name: string, resource: string, viewType: ViewType, actionName?: string) => {
    const resourceSchema = getResourceSchema(resource);
    if (!resourceSchema) return;

    const resourceElement = resources[resource];
    if (resourceElement && isResourceElement(resourceElement)) return;

    const viewSchema = resourceSchema.views.find((view) => view.type === viewType);

    if (!viewSchema) return;

    const ViewElement = hasViewProp(resourceElement, viewType)
      ? resourceElement.props[viewType]
      : defaultViewProvider({resource, name, actionName, type: viewType});

    if (!ViewElement) return;

    // A view opened on an overlay (dialog / side panel) is built here rather than by the router, so
    // the resource's field shapes have to be handed over explicitly — otherwise the same resource
    // would look one way inline and another in a dialog.
    const {fieldDefaults} = (resourceElement?.props || {}) as {fieldDefaults?: FieldDefaults};

    return getViewWithProviders({view: ViewElement, fieldDefaults});
  };
};
