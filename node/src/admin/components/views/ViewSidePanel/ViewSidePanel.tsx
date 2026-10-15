import React, {ReactNode, useState} from 'react';
import {
  ViewPresentationProvider,
  useOverlayPresentation,
} from '@admin/contexts/ViewPresentationContext';
import {InsidePanelContextProvider} from '@design/contexts/InsidePanelContext';
import {PanelContent} from '@design/molecules/PanelContent';
import {PanelHeader} from '@design/molecules/PanelHeader';
import {SidePanel} from '@design/organisms/SidePanel';
import {Box} from '@mui/material';
import {useResizableSidePanel} from './useResizableSidePanel';

export type ViewSidePanelProps = {
  /** Called when the panel's close button is clicked. */
  onClose: () => void;
  /** Panel content — a view rendered inside the panel's overlay presentation. */
  children: ReactNode;
  /** Optional direct header title for schema-free use (a portaled view title also lands here). */
  title?: ReactNode;
  /** Optional direct header actions for schema-free use (portaled view actions also land here). */
  actions?: ReactNode;
};

// The floating close button (top-right of the design `SidePanel`) overlaps the header's action
// area, so reserve that corner on the header row.
const RESERVE_CLOSE_BUTTON = {pr: 5} as const;

/**
 * Reusable admin-layer docked side panel — the docked analogue of `ViewDialog`. A drag-resizable,
 * persistent-width panel that mounts an overlay presentation so a view rendered inside portals its
 * title / actions into the panel header (a design-layer `PanelHeader`). The resize + overlay wiring
 * lives here, the design-layer `SidePanel` supplies the presentational shell, and the panel stays
 * schema-free so it can dock beside any list (e.g. `ListShell.sidePanel`).
 *
 * Width persists per user through the preferences store and is clamped so the list beside it keeps
 * a usable width (see `useResizableSidePanel`). A panel is an overlay surface with a title +
 * actions header but no subtitle or footer — the view portals into those slots through the same
 * `useOverlayPresentation` mechanism `ViewDialog` uses.
 */
export const ViewSidePanel = ({onClose, children, title, actions}: ViewSidePanelProps) => {
  const [titleEl, setTitleEl] = useState<HTMLElement | null>(null);
  const [actionsEl, setActionsEl] = useState<HTMLElement | null>(null);
  const {panelRef, width, onResizeStart} = useResizableSidePanel();

  const presentation = useOverlayPresentation({presentation: 'panel', titleEl, actionsEl});

  return (
    <SidePanel
      ref={panelRef}
      onClose={onClose}
      onResizeStart={onResizeStart}
      sx={{width: {xs: '100%', md: width}, flexShrink: 0}}
    >
      <PanelHeader
        sx={RESERVE_CLOSE_BUTTON}
        label={
          <>
            {title}
            {/* Placeholder the view portals its title into (empty when a direct `title` is used). */}
            <Box component="span" ref={setTitleEl} sx={{display: 'contents'}} />
          </>
        }
        actions={
          <>
            {actions}
            <Box component="span" ref={setActionsEl} sx={{display: 'contents'}} />
          </>
        }
      />
      <PanelContent>
        {/* The panel shell is the card the content sits on (a `SidePanel`, not a `Panel`, so it has
            to say so itself): everything inside starts inside a panel and draws no card of its own. */}
        <InsidePanelContextProvider value={true}>
          <ViewPresentationProvider value={presentation}>{children}</ViewPresentationProvider>
        </InsidePanelContextProvider>
      </PanelContent>
    </SidePanel>
  );
};
