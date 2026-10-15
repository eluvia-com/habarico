import React from 'react';
import {Link, breadcrumbsClasses} from '@mui/material';
import {PortalBreadcrumbListItem} from './PortalBreadcrumbListItem';

export type PortalBreadcrumbsEllipsisProps = {
  /** Opens the popover owned by {@link PortalBreadcrumbsCollapseProvider}; the event's target is
   *  the anchor. */
  onOpen: (event: React.MouseEvent<HTMLElement>) => void;
};

/**
 * The collapsed trail's `…` crumb — the button alone. The popover it opens, and the list of hidden
 * crumbs inside it, belong to {@link PortalBreadcrumbsCollapseProvider}: the entries are portalled
 * in by the crumbs themselves so each keeps its own React context. Mirrors the `…` of the
 * data-driven {@link DataBreadcrumbs}.
 */
export const PortalBreadcrumbsEllipsis = ({onOpen}: PortalBreadcrumbsEllipsisProps) => (
  <PortalBreadcrumbListItem className={breadcrumbsClasses.li}>
    <Link
      component="button"
      type="button"
      underline="hover"
      onClick={onOpen}
      sx={{
        color: 'text.secondary',
        fontWeight: 'fontWeightSemiBold',
        lineHeight: 1,
        cursor: 'pointer',
      }}
    >
      …
    </Link>
  </PortalBreadcrumbListItem>
);
