import React from 'react';
import {Link, Typography} from '@mui/material';
import {EllipsisWithTitle, MaxWidthObject} from '../../../atoms/EllipsisWithTitle';
import {RouterLink} from '../../../atoms/RouterLink';
import {LayoutBreadcrumb} from '../../types';

// Responsive cap so a long parent crumb truncates with an ellipsis instead of crowding out the
// current one; the full title shows in a tooltip. The current crumb is not capped — it truncates to
// the room the header leaves it.
const BREADCRUMB_MAX_WIDTH: MaxWidthObject = {
  xs: 100,
  sm: 200,
  md: 350,
  lg: 450,
  xl: 600,
};

export type DataBreadcrumbItemProps = {
  breadcrumb: LayoutBreadcrumb;
  /** The current (last) crumb — rendered emphasised and non-muted. */
  current?: boolean;
};

/** A single crumb: a router link when it has a path, plain text otherwise. */
export const DataBreadcrumbItem = ({breadcrumb, current}: DataBreadcrumbItemProps) => {
  const sx = {
    color: current ? 'text.primary' : 'text.secondary',
    fontWeight: current ? 'fontWeightSemiBold' : 'fontWeightMedium',
    textWrap: 'nowrap',
  } as const;

  // The current crumb is truncated by the room the header leaves it (see `DataBreadcrumbs`), so it
  // takes no fixed cap — the parents keep theirs.
  const label = (
    <EllipsisWithTitle maxWidth={current ? 'none' : BREADCRUMB_MAX_WIDTH}>
      {breadcrumb.title}
    </EllipsisWithTitle>
  );

  return breadcrumb.path ? (
    <Link component={RouterLink} underline="hover" href={breadcrumb.path} sx={sx}>
      {label}
    </Link>
  ) : (
    <Typography component="span" sx={sx}>
      {label}
    </Typography>
  );
};
