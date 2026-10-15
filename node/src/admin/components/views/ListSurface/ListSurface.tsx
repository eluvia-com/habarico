import React, {ReactNode} from 'react';
import {Box, Card} from '@mui/material';

export type ListSurfaceProps = {
  children: ReactNode;
  /** Optional docked detail panel; when present the surface is a two-column layout. */
  sidePanel?: ReactNode;
};

// The list view's paper surface. `ViewContent` is card-less (HAB-759), so the single visible
// surface for a list is this `Card` — matching `design/pages/PropertyList` (a card whose header
// hosts the filter bar + datagrid-config toolbar, body = the datagrid). It fills its parent as a
// flex column so the datagrid body can take the remaining height. Owns the two-column layout that
// docks an optional `sidePanel` beside the list. Owned by the list presentation, never by
// `ViewContent`.
export const ListSurface = ({children, sidePanel}: ListSurfaceProps) => (
  <Card
    sx={{height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column'}}
    className="ListSurface"
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        // No gap on mobile: the full-width panel is preceded by the (0-width) list, so a gap
        // would shift the panel right and push its close button off the edge.
        gap: 0,
        width: '100%',
        minWidth: 0,
        flex: 1,
        minHeight: 0,
      }}
    >
      <Box sx={{flex: 1, minWidth: 0}}>{children}</Box>
      {sidePanel}
    </Box>
  </Card>
);
