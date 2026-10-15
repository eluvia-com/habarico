import React, {ReactNode, useId} from 'react';
import {createPortal} from 'react-dom';
import {Link, MenuItem, Typography, breadcrumbsClasses} from '@mui/material';
import {ellipsisWithTitleClasses} from '../../../atoms/EllipsisWithTitle';
import {RouterLink} from '../../../atoms/RouterLink';
import {PortalBreadcrumbListItem} from './PortalBreadcrumbListItem';
import {
  PORTAL_CRUMB_ID_ATTR,
  usePortalBreadcrumbsCollapse,
} from './PortalBreadcrumbsCollapseContext';

export type PortalBreadcrumbItemProps = {
  /** Target path — renders a client-side router link. Omit for the current (last) crumb. */
  path?: string;
  children: ReactNode;
};

/**
 * A single crumb for portal-defined breadcrumb trails — the ones a deep view composes as JSX and
 * portals into the header via {@link BreadcrumbsPortal}/{@link PortalBreadcrumbsOutlet}. It is the
 * counterpart to {@link DataBreadcrumbItem}, which the data-driven {@link DataBreadcrumbs} builds from
 * a data trail; both look the same (muted links, an emphasised current crumb, dot separators).
 *
 * A `path` renders a muted router link; without one the crumb is the emphasised current page.
 * Pass plain nodes — this does no text processing; wrap the label in `DynamicText` at the call
 * site when it needs template resolution.
 *
 * The last crumb of the trail shrinks to the room the header leaves it. A plain-text label then
 * ends in an ellipsis; wrap it in `EllipsisWithTitle` to also get the full label in a tooltip (and,
 * on a parent crumb, a width cap).
 *
 * Inside a {@link BreadcrumbsPortal} the crumb takes part in collapsing
 * ({@link PortalBreadcrumbsCollapseProvider}): once the trail has more than two crumbs the middle
 * ones hide themselves and render a second copy of their label into the `…` popover, matching
 * {@link DataBreadcrumbs}.
 */
export const PortalBreadcrumbItem = ({path, children}: PortalBreadcrumbItemProps) => {
  const collapse = usePortalBreadcrumbsCollapse();
  const id = useId();

  // Position among the folded crumbs — `-1` when this crumb is not folded. It doubles as the
  // popover entry's flex `order`, so the entries read in trail order however they mount.
  const hiddenIndex = collapse?.hiddenOrder.indexOf(id) ?? -1;
  const isHidden = hiddenIndex >= 0;
  // The current crumb is the last one in the trail. Inside a `BreadcrumbsPortal`
  // the collapse provider knows the trail's real
  // order; a crumb rendered outside one falls back to the `path` convention.
  const isCurrent = collapse ? collapse.lastId === id : !path;
  const isLast = collapse?.collapsed && isCurrent;
  const menuContainer = collapse?.menuContainer ?? null;

  const sx = {
    color: path ? 'text.secondary' : 'text.primary',
    fontWeight: path ? 'fontWeightMedium' : 'fontWeightSemiBold',
    textWrap: 'nowrap',
    // The current crumb is truncated by the room the header leaves it (it is the one crumb that
    // shrinks), so the call site's viewport-based `maxWidth` cap would only cut it short while there
    // is still space next to it — it is capped by the label's width instead, so it ellipsizes (and
    // shows its tooltip) as the crumb shrinks. The parents keep their cap.
    ...(isCurrent && {[`& .${ellipsisWithTitleClasses.root}`]: {maxWidth: '100%'}}),
  } as const;

  return (
    <>
      <PortalBreadcrumbListItem
        className={breadcrumbsClasses.li}
        {...{[PORTAL_CRUMB_ID_ATTR]: id}}
        // Inline (not `sx`) so the collapse state is one style mutation rather than a fresh emotion
        // class per toggle — and so it is inspectable. `display: none` folds a middle crumb away; the
        // `…` crumb is appended after the whole trail in the DOM, so flex `order` pushes the last crumb
        // past it and the visual sequence stays `first … last`.
        // Only the current crumb shrinks when the trail runs out of room; the parents keep their own
        // width (already capped by their label's `maxWidth`) — even a sub-pixel share of the shrink
        // would ellipsize a parent's last characters.
        style={{
          ...(isCurrent && {flexShrink: 1}),
          ...(isHidden && {display: 'none'}),
          ...(isLast && {order: 1}),
        }}
      >
        {path ? (
          <Link component={RouterLink} underline="none" href={path} sx={sx}>
            {children}
          </Link>
        ) : (
          <Typography component="span" sx={sx}>
            {children}
          </Typography>
        )}
      </PortalBreadcrumbListItem>
      {/* The folded copy. It is rendered *here*, from the crumb's own place in the React tree, and
          only moved into the popover's list by the portal — so `children` keeps every context the
          call site wrapped it in. A label like `<ResourceRepresentation>` reads its resource from
          `ResourceContextProvider`; handing the bare element to the collapse provider to re-render
          next to the popover gave it the page's resource instead, and it rendered nothing (HAB-961). */}
      {isHidden &&
        menuContainer &&
        createPortal(
          path ? (
            <MenuItem
              component={RouterLink}
              href={path}
              onClick={collapse?.closeMenu}
              style={{order: hiddenIndex}}
            >
              {children}
            </MenuItem>
          ) : (
            <MenuItem disabled style={{order: hiddenIndex}}>
              {children}
            </MenuItem>
          ),
          menuContainer
        )}
    </>
  );
};
