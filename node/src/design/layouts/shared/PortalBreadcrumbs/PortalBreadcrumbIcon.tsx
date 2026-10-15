import React, {ReactNode} from 'react';
import {Box} from '@mui/material';

export type PortalBreadcrumbIconProps = {
  children: ReactNode;
};

/**
 * A leading icon for a portal breadcrumb trail — the counterpart to the `icon` slot of the
 * data-driven `DataBreadcrumbs`. Portal it as the **first** child (before the
 * `PortalBreadcrumbItem`s) and it renders ahead of the trail, spaced from the first crumb.
 *
 * Rendered as an `<li>` so it stays valid inside the outlet's `<ol>`, but it is not a crumb: it
 * carries no dot separator, and — being a different element from `PortalBreadcrumbItem` — it does
 * not trigger the separator before the first crumb either.
 */
export const PortalBreadcrumbIcon = ({children}: PortalBreadcrumbIconProps) => (
  <Box
    component="li"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      color: 'text.primary',
      flexShrink: 0,
      mr: 1,
    }}
  >
    {children}
  </Box>
);
