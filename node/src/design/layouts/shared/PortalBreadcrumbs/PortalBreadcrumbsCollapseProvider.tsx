import React, {ReactNode, useLayoutEffect, useMemo, useState} from 'react';
import {MenuList, menuItemClasses} from '@mui/material';
import {usePopover} from '../../../hooks/usePopover';
import {
  PORTAL_CRUMB_ID_ATTR,
  PortalBreadcrumbsCollapseContext,
} from './PortalBreadcrumbsCollapseContext';
import {PortalBreadcrumbsEllipsis} from './PortalBreadcrumbsEllipsis';

export type PortalBreadcrumbsCollapseProviderProps = {
  /** The outlet `<ol>` the crumbs are portalled into — the source of truth for their order. */
  container: HTMLElement;
  children?: ReactNode;
};

const readOrder = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll<HTMLElement>(`[${PORTAL_CRUMB_ID_ATTR}]`))
    .map((el) => el.getAttribute(PORTAL_CRUMB_ID_ATTR))
    .filter((id): id is string => id !== null);

const sameOrder = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/**
 * Gives the portalled breadcrumb trail the same "fold the middle crumbs behind a `…` popover"
 * behaviour the data-driven {@link DataBreadcrumbs} has. The crumbs arrive as an opaque, often
 * recursive JSX tree (`ViewSchemaBreadcrumbs` → route / menu breadcrumb components), so this provider
 * can't read them as a list: their order is read straight from the outlet `<ol>`'s DOM — watched with
 * a `MutationObserver`, since the crumbs mount and mutate inside the portal, outside this component's
 * render.
 *
 * More than two crumbs → the middle ids are marked hidden (the item renders `display: none`) and an
 * extra `…` crumb is appended whose popover lists them.
 *
 * This provider deliberately never holds the crumbs' labels. It owns only the popover's empty list
 * and lets each hidden crumb portal its own entry in (see {@link PortalBreadcrumbItem}). Collecting
 * label elements here and re-rendering them next to the popover was the HAB-961 bug: a label such as
 * `<ResourceRepresentation>` resolves its resource from context, and replayed outside the crumb's own
 * `ResourceContextProvider` it picked up the page's resource instead and rendered nothing.
 */
export const PortalBreadcrumbsCollapseProvider = ({
  container,
  children,
}: PortalBreadcrumbsCollapseProviderProps) => {
  const [order, setOrder] = useState<string[]>([]);
  // The popover's `<ul>`, as a state rather than a ref: the hidden crumbs portal into it, so they
  // have to re-render once it exists.
  const [menuContainer, setMenuContainer] = useState<HTMLElement | null>(null);
  const {Popover, openPopover, closePopover} = usePopover();

  useLayoutEffect(() => {
    const sync = () =>
      setOrder((prev) => {
        const next = readOrder(container);
        return sameOrder(prev, next) ? prev : next;
      });

    sync();
    // `childList` + `subtree` catches crumbs mounting / unmounting (incl. the async nested route and
    // menu ones). Style-only changes are attribute mutations and are deliberately not watched, so
    // marking a crumb hidden does not re-trigger the sync. The portalled popover entries carry no
    // `PORTAL_CRUMB_ID_ATTR`, so they never enter `readOrder` even while the closed popover keeps
    // them mounted inside this same `<ol>`.
    const observer = new MutationObserver(sync);
    observer.observe(container, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [container]);

  const collapsed = order.length > 2;

  const value = useMemo(
    () => ({
      collapsed,
      hiddenOrder: collapsed ? order.slice(1, -1) : [],
      lastId: order[order.length - 1],
      menuContainer,
      closeMenu: closePopover,
    }),
    [collapsed, order, menuContainer, closePopover]
  );

  return (
    <PortalBreadcrumbsCollapseContext.Provider value={value}>
      {children}
      {collapsed && (
        <>
          <PortalBreadcrumbsEllipsis onOpen={openPopover} />
          <Popover
            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
            transformOrigin={{vertical: 'top', horizontal: 'left'}}
          >
            {/* Left empty on purpose — the hidden crumbs fill it by portal, each from its own place
                in the React tree. `column` flex plus a per-entry `order` keeps them in trail order
                regardless of the order they mount in. */}
            <MenuList
              ref={setMenuContainer}
              disablePadding
              sx={{
                p: 0.5,
                gap: 0.5,
                minWidth: 180,
                display: 'flex',
                flexDirection: 'column',
                [`& .${menuItemClasses.root}`]: {px: 1, borderRadius: 0.75},
              }}
            />
          </Popover>
        </>
      )}
    </PortalBreadcrumbsCollapseContext.Provider>
  );
};
