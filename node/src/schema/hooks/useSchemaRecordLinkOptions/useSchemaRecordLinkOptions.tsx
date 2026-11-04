import React from 'react';
import {useResourceContext} from 'react-admin';
import {useSidePanelController} from '@admin/contexts/SidePanelContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {ViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {UseRecordLinkProps} from '@admin/hooks/useRecordLink';
import {SchemaViewRouter} from '@schema/components/views/SchemaViewRouter';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {SidePanelView} from '@schema/types';
import {
  presentationToViewMode,
  resolveOpenMode,
  viewModeToPresentation,
} from '@schema/utils/viewMode';

export type UseSchemaRecordLinkOptionsProps = {
  link?: boolean | 'show' | 'edit';
  // The surface the field asks for (`RelationFieldOptions(link_mode=...)`). Resolved here against
  // the target view's own `mode`, the container the link sits in and the availability of a docked
  // panel; the resolved value is returned in the options.
  linkMode?: ViewPresentation;
};

// The `useRecordLink` options only a schema can supply. Everything else that hook takes
// (`keepLinkedParent`, `linkMode`, `dialogWidth`) is the caller's own and is passed to it directly,
// not laundered through here.
export type SchemaRecordLinkOptions = Pick<
  UseRecordLinkProps,
  'viewType' | 'linkMode' | 'changeView' | 'closeOverlay' | 'openSidePanel' | 'renderContent'
>;

// The schema half of `useRecordLink`: it resolves the schema-level `link` onto a concrete
// `viewType` (a resource may have no show view, or no edit view, in which case the link is simply
// not offered) and supplies the schema's own view router as the overlay renderer.
//
// It also resolves the surface: `link_mode` is only a request, and what it ends up meaning depends
// on the target view's own `mode`, the container the link sits in and whether there is a panel to
// dock into — the same resolution a view action goes through (`resolveOpenMode`), so a chip and an
// action opening the same record behave alike. The layering forces it here rather than in
// `useRecordLink`: the hook is in the admin ring and cannot reach the schema.
//
// It is named for what it returns — options, not a link. It deliberately stops short of calling
// `useRecordLink`, because the representation it feeds (the admin-layer `RecordRepresentation`)
// calls it on them, and doing so here too would resolve the same link twice. A caller that wants
// the link resolved spreads these into its own:
// `useRecordLink({...useSchemaRecordLinkOptions({link, linkMode}), keepLinkedParent, dialogWidth})`.
export const useSchemaRecordLinkOptions = ({
  link,
  linkMode,
}: UseSchemaRecordLinkOptionsProps): SchemaRecordLinkOptions => {
  const resource = useResourceContext();
  const {hasShowView, hasEditView, getGlobalViewSchema} = useGlobalResourceSchemaContext(resource);
  const {changeView, closeOverlay} = useSchemaViewRouterContext();
  const sidePanel = useSidePanelController<SidePanelView>();
  const {presentation} = useViewPresentation();

  let viewType: 'show' | 'edit' | undefined;
  if (hasShowView && (link === true || link === 'show')) {
    viewType = 'show';
  } else if (hasEditView && (link === true || link === 'edit')) {
    viewType = 'edit';
  }

  return {
    viewType,
    linkMode: viewModeToPresentation(
      resolveOpenMode(
        presentationToViewMode(linkMode),
        viewType ? getGlobalViewSchema(viewType)?.mode : undefined,
        presentation,
        !!sidePanel
      )
    ),
    changeView,
    closeOverlay,
    openSidePanel: ({resource, viewType, viewName, id}) => {
      if (!sidePanel) return false;
      sidePanel.openView({resource, viewType, viewName, id});
      return true;
    },
    renderContent: ({resource, viewType, id, data, onClose}) => (
      <SchemaViewRouter
        resource={resource}
        viewType={viewType}
        viewName={viewType}
        id={id}
        data={data}
        onClose={onClose}
      />
    ),
  };
};
