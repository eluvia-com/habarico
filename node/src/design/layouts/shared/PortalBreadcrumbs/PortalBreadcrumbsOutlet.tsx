import React, {useEffect, useRef} from 'react';
import {breadcrumbsClasses, styled} from '@mui/material';
import {useLayoutDynamicContext} from '../../contexts/LayoutDynamicContext';

const StyledList = styled('ol')({
  listStyle: 'none',
  padding: 0,
  // Lay the crumbs out as a centered flex row (like the data trail's `MuiBreadcrumbs`). Without
  // this the `<li>`s are inline-flex boxes aligned by baseline, and the dot separator on the
  // non-first crumbs shifts their baseline, so they sink below the first crumb.
  display: 'flex',
  alignItems: 'center',
  // This `<ol>` sits as a flex item in the header row (`HeaderSection`'s `Container`) — below
  // `sm`, `DashboardLayout` wraps it onto its own full-width row below the nav trigger and the
  // action icon cluster, rather than sharing space with them. Every crumb renders
  // `white-space: nowrap`, so without an explicit `min-width` this defaults to the row's content
  // (min-content) width and can never shrink below it — the same flex "automatic minimum size"
  // issue fixed for `.Ra{View}-card` in `admin/theme/raDefaults.ts`. Once it shrinks, the current
  // crumb ellipsizes to the room left (see `PortalBreadcrumbListItem`), and the header compacts its
  // actions when even that leaves too little (`useHeaderActionsCompaction`). Only when the parent
  // crumbs alone exceed the row is the trail as a whole still too wide — let it scroll horizontally
  // then instead of clipping or hiding crumbs.
  minWidth: 0,
  flexShrink: 1,
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': {display: 'none'},
});

/**
 * An alternative breadcrumbs slot component (plug into `DashboardLayout`'s `breadcrumbs={{Component}}`)
 * for portal-defined crumbs: instead of rendering the `breadcrumbs` data trail, it renders an empty
 * `<ol>` and registers it as the dynamic context's breadcrumbs outlet, so a deep view can portal its
 * own breadcrumb JSX into the header via {@link BreadcrumbsPortal}.
 */
export const PortalBreadcrumbsOutlet = () => {
  const {setBreadcrumbsContainer} = useLayoutDynamicContext();
  const outletRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (outletRef.current) {
      setBreadcrumbsContainer?.(outletRef.current);
    }
  }, [setBreadcrumbsContainer, outletRef]);

  return <StyledList className={breadcrumbsClasses.ol} ref={outletRef} />;
};
