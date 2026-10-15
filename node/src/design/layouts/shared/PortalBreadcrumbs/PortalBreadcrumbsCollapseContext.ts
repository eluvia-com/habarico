import {createContext, useContext} from 'react';

/** The `data-*` attribute a {@link PortalBreadcrumbItem}'s `<li>` carries so the collapse provider
 *  can read the trail's order straight from the outlet `<ol>`'s DOM. */
export const PORTAL_CRUMB_ID_ATTR = 'data-portal-crumb-id';

export type PortalBreadcrumbsCollapseContextValue = {
  /** Whether the trail is currently collapsed (more than two crumbs). */
  collapsed: boolean;
  /**
   * Ids of the crumbs folded behind the `…` — the middle ones — in trail order. A crumb finds both
   * whether it is hidden and where it belongs in the popover by its index here.
   */
  hiddenOrder: string[];
  /** Id of the last crumb: when collapsed it is pushed past the appended `…` with flex `order`. */
  lastId?: string;
  /**
   * The `…` popover's list element while the popover exists, otherwise `null`. A hidden crumb
   * renders its popover entry in its own place in the React tree and portals it in here, so the
   * entry keeps every context the crumb was written against (`ResourceContextProvider`, record
   * contexts, …). Handing the provider a detached label element instead is what broke HAB-961.
   */
  menuContainer: HTMLElement | null;
  /** Closes the `…` popover — a portalled entry calls it when its link is followed. */
  closeMenu: () => void;
};

export const PortalBreadcrumbsCollapseContext =
  createContext<PortalBreadcrumbsCollapseContextValue | null>(null);

/**
 * The collapse controller for the portal breadcrumb trail, or `null` when a crumb is rendered
 * outside a {@link BreadcrumbsPortal} (then it just renders inline, no collapsing).
 */
export const usePortalBreadcrumbsCollapse = () => useContext(PortalBreadcrumbsCollapseContext);
