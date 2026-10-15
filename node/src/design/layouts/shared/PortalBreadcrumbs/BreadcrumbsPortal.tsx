import React, {ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {useLayoutDynamicContext} from '../../contexts/LayoutDynamicContext';
import {PortalBreadcrumbsCollapseProvider} from './PortalBreadcrumbsCollapseProvider';

export type BreadcrumbsPortalProps = {
  children?: ReactNode;
};

/**
 * Portals its children into the breadcrumbs outlet — the `<ol>` registered by {@link PortalBreadcrumbsOutlet}
 * — so a deep view can render its own breadcrumb JSX up in the header while keeping its React context.
 * Renders nothing until an outlet has been registered.
 *
 * The portalled trail is wrapped in {@link PortalBreadcrumbsCollapseProvider}, so a trail of more
 * than two crumbs folds its middle crumbs behind a `…` popover — the same behaviour the data-driven
 * {@link DataBreadcrumbs} has.
 */
export const BreadcrumbsPortal = ({children}: BreadcrumbsPortalProps) => {
  const {breadcrumbsContainer} = useLayoutDynamicContext();

  if (!breadcrumbsContainer) return;
  return createPortal(
    <PortalBreadcrumbsCollapseProvider container={breadcrumbsContainer}>
      {children}
    </PortalBreadcrumbsCollapseProvider>,
    breadcrumbsContainer
  );
};
