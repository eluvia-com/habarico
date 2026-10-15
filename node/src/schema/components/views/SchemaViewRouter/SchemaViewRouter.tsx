import React from 'react';
import {useCallback, useMemo, useState} from 'react';
import {Identifier, ResourceContextProvider} from 'react-admin';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {ValueLocationContextProvider} from '@design/contexts/ValueLocationContext';
import {ResetBoxProvider} from '@schema/components/boxes/ResetBoxProvider';
import {ParentResourceDescriptorsProvider} from '@schema/contexts/ParentResourceDescriptorsContext';
import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {SchemaViewRouterContextProvider} from '@schema/contexts/SchemaViewRouterContext';
import {ChangeViewProps} from '@schema/contexts/SchemaViewRouterContext/types';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {useGetResourceViewElement} from '@schema/hooks/useGetResourceViewElement';
import {ViewType} from '@schema/types';

type SchemaViewRouterProps = {
  resource: string;
  actionName?: string;
  viewType: ViewType;
  viewName: string;
  id?: Identifier;
  data?: Record<string, string>;
  onClose?: () => void;
  target?: string;
};

type ChangeViewState = Omit<ChangeViewProps, 'viewType'> & {
  viewName: string;
  viewType: ViewType;
};

// Renders a routed view element and owns in-overlay navigation, but is surface-agnostic: the
// presentation (page / dialog / panel) and the title/actions portal targets come from the ambient
// `ViewPresentationContext` supplied by the surface (a page's layout default, `ViewDialog`, or
// `SchemaSidePanel`). The router only *reads* that context — it never rewrites the presentation
// setters — so a single portal mechanism drives every surface.
export const SchemaViewRouter = ({
  resource,
  actionName,
  viewType,
  viewName,
  id,
  data,
  onClose,
  target,
}: SchemaViewRouterProps) => {
  const [schemaViewProps, setSchemaViewProps] = useState<ChangeViewState>({
    resource,
    viewName,
    actionName,
    viewType,
    id,
    data,
  });
  const getResourceView = useGetResourceViewElement();

  const {
    changeView,
    prevView,
    id: parentId,
    resource: parentResource,
  } = useSchemaViewRouterContext();
  const {presentation} = useViewPresentation();
  const isInOverlay = presentation !== 'page';

  const parentDescriptors = useParentResourceDescriptorsContext();

  const handleChangeView = useCallback((props: ChangeViewProps) => {
    setSchemaViewProps({
      resource: props.resource,
      viewName: props.viewName,
      actionName: props.actionName,
      viewType: props.viewType,
      id: props.id,
      data: props.data,
    });
    return true;
  }, []);

  const handlePrevView = useCallback(() => {
    if (onClose) onClose();
    return true;
  }, [onClose]);

  // Closing is the same `onClose`, exposed under its own name: callers that navigated away from this
  // overlay need to close it without asking for a "previous view", which on a page navigates.
  const handleCloseOverlay = useCallback(() => onClose?.(), [onClose]);

  const routingValue = useMemo(
    () => ({
      ...schemaViewProps,
      // Inside an overlay a view is swapped in place (no route); on a page it defers to the routed
      // navigation from the outer context.
      changeView: isInOverlay ? handleChangeView : changeView,
      prevView: isInOverlay ? handlePrevView : prevView,
      // Only an overlay has something to close, and its absence is the signal for that.
      closeOverlay: isInOverlay ? handleCloseOverlay : undefined,
    }),
    [
      schemaViewProps,
      isInOverlay,
      handleChangeView,
      changeView,
      handlePrevView,
      prevView,
      handleCloseOverlay,
    ]
  );

  const element = getResourceView(
    schemaViewProps.viewName,
    schemaViewProps.resource,
    schemaViewProps.viewType,
    schemaViewProps.actionName
  );

  // Memoized: `ParentResourceDescriptorsProvider` doesn't memoize its own `value` — a fresh array
  // here on every render of this router (any view-switch, any unrelated re-render) invalidates the
  // context for every consumer down the whole routed subtree (every box's `useGetTargetValues`,
  // every nested `SchemaListBox`/`SchemaSubResource`), regardless of whether the descriptors changed.
  const parentResourceDescriptorsValue = useMemo(
    () => [...parentDescriptors, {target, resource: parentResource, recordId: parentId}],
    [parentDescriptors, target, parentResource, parentId]
  );

  return (
    <ParentResourceDescriptorsProvider value={parentResourceDescriptorsValue}>
      {/* Whether the surface above is a card is declared by that surface (`Panel`, `ViewDialog`,
          `ViewSidePanel`), not derived here — see `ResetBoxProvider`. */}
      <ResetBoxProvider>
        <ValueLocationContextProvider value={{isInCollection: false, isNested: false}}>
          <ResourceContextProvider value={schemaViewProps.resource}>
            <SchemaViewRouterContextProvider context={routingValue}>
              {element}
            </SchemaViewRouterContextProvider>
          </ResourceContextProvider>
        </ValueLocationContextProvider>
      </ResetBoxProvider>
    </ParentResourceDescriptorsProvider>
  );
};
