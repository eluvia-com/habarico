import React from 'react';
import {ViewToolbar} from '@admin/components/views/ViewToolbar';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {BreadcrumbsPortal} from '@design/layouts/shared/PortalBreadcrumbs';
import {TabsLocationProvider} from '@foundation/hooks/useTabsLocation';
import {Box} from '@mui/material';
import {ViewActions} from './ViewActions';
import {ViewSubtitle} from './ViewSubtitle';
import {ViewTitle} from './ViewTitle';

export type ViewContentProps = {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  bottomActions?: React.ReactNode;
};

// A card-less content frame: a plain flex column, no visible surface of its own. The paper
// surface is a per-view-type concern — inner `Panel`s for detail/form, a `ListSurface` card for
// list — never rendered here (HAB-759). The frame is a flex column so title/toolbar/breadcrumbs
// take their natural height and the content region takes the rest.
export const ViewContent = ({
  children,
  toolbarActions,
  title,
  subtitle,
  breadcrumbs,
  bottomActions,
}: ViewContentProps) => {
  const {presentation, setBottomActions} = useViewPresentation();
  const isInOverlay = presentation !== 'page';

  return (
    // Every view (page, dialog or panel) gets its own tab store here - synced to the URL hash only
    // on a page, so a dialog/side-panel tab box can never collide with one on the page behind it,
    // even when both happen to share a box name (mirrors react-admin's `syncWithLocation`).
    <TabsLocationProvider syncWithLocation={!isInOverlay}>
      <Box sx={{height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column'}}>
        <ViewTitle>{title}</ViewTitle>
        <ViewSubtitle>{subtitle}</ViewSubtitle>
        <ViewActions>{toolbarActions}</ViewActions>
        <Box sx={{flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column'}}>
          {children}
        </Box>
        {/* On a page `setBottomActions` returns `undefined`, so the actions render in-flow as a
            `ViewToolbar` footer bar; in a dialog it portals them into `DialogActions`. */}
        {bottomActions &&
          (setBottomActions(bottomActions) ?? <ViewToolbar>{bottomActions}</ViewToolbar>)}
        {!isInOverlay && breadcrumbs && <BreadcrumbsPortal>{breadcrumbs}</BreadcrumbsPortal>}
      </Box>
    </TabsLocationProvider>
  );
};
