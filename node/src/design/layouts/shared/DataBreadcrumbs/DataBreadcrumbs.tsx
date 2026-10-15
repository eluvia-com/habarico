import React from 'react';
import {Box, Link, MenuItem, MenuList, Breadcrumbs as MuiBreadcrumbs} from '@mui/material';
import {RouterLink} from '../../../atoms/RouterLink';
import {usePopover} from '../../../hooks/usePopover';
import {useLayoutDynamicContext} from '../../contexts/LayoutDynamicContext';
import {BreadcrumbsComponentProps} from '../../types';
import {DataBreadcrumbItem} from './DataBreadcrumbItem';
import {DataBreadcrumbSeparator} from './DataBreadcrumbSeparator';

export type DataBreadcrumbsProps = BreadcrumbsComponentProps;

/**
 * The layout breadcrumb trail: an optional leading icon, dot separators, and — when there
 * are more than two crumbs — a collapsed `first … last` view whose `…` opens a popover
 * listing the hidden middle crumbs. Reads the trail from the layout's dynamic context
 * (overridable via `items`); renders nothing when empty.
 */
export const DataBreadcrumbs = ({icon, items}: DataBreadcrumbsProps) => {
  const {breadcrumbs: contextBreadcrumbs} = useLayoutDynamicContext();
  const breadcrumbs = items ?? contextBreadcrumbs;

  const {Popover, openPopover, closePopover} = usePopover();

  if (breadcrumbs.length === 0) return null;

  const lastIndex = breadcrumbs.length - 1;
  const isCollapsed = breadcrumbs.length > 2;
  const hiddenItems = isCollapsed ? breadcrumbs.slice(1, lastIndex) : [];

  const children = isCollapsed
    ? [
        <DataBreadcrumbItem key="first" breadcrumb={breadcrumbs[0]} />,
        <Link
          key="ellipsis"
          component="button"
          type="button"
          underline="hover"
          onClick={openPopover}
          sx={{
            color: 'text.secondary',
            fontWeight: 'fontWeightSemiBold',
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          …
        </Link>,
        <DataBreadcrumbItem key="last" breadcrumb={breadcrumbs[lastIndex]} current />,
      ]
    : breadcrumbs.map((breadcrumb, index) => (
        <DataBreadcrumbItem
          key={breadcrumb.title}
          breadcrumb={breadcrumb}
          current={index === lastIndex}
        />
      ));

  return (
    <Box
      sx={{
        minWidth: 0,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        overflowX: 'hidden',
      }}
    >
      {icon && (
        <Box
          sx={{display: 'inline-flex', alignItems: 'center', color: 'text.primary', flexShrink: 0}}
        >
          {icon}
        </Box>
      )}
      <MuiBreadcrumbs
        separator={<DataBreadcrumbSeparator />}
        sx={{
          minWidth: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          '.MuiBreadcrumbs-ol': {flexWrap: 'nowrap', minWidth: 0},
          // Only the current (last) crumb shrinks when the trail runs out of room — it ellipsizes to
          // the width the header leaves it; the parents and the `…` keep theirs (see
          // `PortalBreadcrumbListItem` for the portal trail's counterpart).
          '.MuiBreadcrumbs-li': {display: 'flex', alignItems: 'center', minWidth: 0, flexShrink: 0},
          '.MuiBreadcrumbs-li:last-of-type': {flexShrink: 1},
          '.MuiBreadcrumbs-li > *': {display: 'flex', minWidth: 0, overflow: 'hidden'},
        }}
      >
        {children}
      </MuiBreadcrumbs>
      <Popover
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'top', horizontal: 'left'}}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            minWidth: 180,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {hiddenItems.map((breadcrumb) =>
            breadcrumb.path ? (
              <MenuItem
                key={breadcrumb.title}
                component={RouterLink}
                href={breadcrumb.path}
                onClick={closePopover}
                sx={{px: 1, borderRadius: 0.75}}
              >
                {breadcrumb.title}
              </MenuItem>
            ) : (
              <MenuItem key={breadcrumb.title} disabled>
                {breadcrumb.title}
              </MenuItem>
            )
          )}
        </MenuList>
      </Popover>
    </Box>
  );
};
