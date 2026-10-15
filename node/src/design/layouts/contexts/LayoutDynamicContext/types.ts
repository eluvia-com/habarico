import {LayoutBreadcrumb, LayoutNotification, LayoutUser} from '../../types';

export type LayoutDynamicContextState = {
  // Dynamic external state (changes at runtime independent of the layout's own props). `breadcrumbs`
  // and `notifications` are held as internal state and populated by a concrete view through the
  // setters below (the layout no longer receives them as props).
  breadcrumbs: LayoutBreadcrumb[];
  setBreadcrumbs: (breadcrumbs: LayoutBreadcrumb[]) => void;
  currentUser: LayoutUser | null;
  notifications: LayoutNotification[] | null;
  setNotifications: (notifications: LayoutNotification[] | null) => void;

  // Portal target for the current view's global actions, rendered in the header between the
  // breadcrumbs and the search toggle (see `HeaderActions`).
  actionsContainer?: HTMLDivElement;
  setActionsContainer?: (el: HTMLDivElement) => void;

  // Portal target for the current view's page-level title. Mirror of `actionsContainer`; the
  // page-default `setTitle` (in `useViewPresentation`) portals into it. Undefined until a layout
  // renders the target, so `setTitle` is a safe no-op until then.
  titleContainer?: HTMLDivElement;
  setTitleContainer?: (el: HTMLDivElement) => void;

  // Portal target (`<ol>`) for schema-computed breadcrumbs — a deep view portals its breadcrumb JSX
  // into this header slot (see `BreadcrumbsPortal`). Mirror of the actions / title portals. Distinct
  // from the `breadcrumbs` data trail above, which the default breadcrumbs component renders instead.
  breadcrumbsContainer?: HTMLOListElement;
  setBreadcrumbsContainer?: (el: HTMLOListElement) => void;
};
