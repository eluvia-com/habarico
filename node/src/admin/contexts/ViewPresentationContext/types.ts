import {ReactNode, ReactPortal} from 'react';

// The surface the current view is rendered on: a full routed `page`, a `dialog`, or a docked
// side `panel`. This is the actual runtime container - distinct from `ViewModeType` (the requested mode,
// which also has `redirect`). Descendants read it to adapt (e.g. icon-only toolbar in a narrow
// panel, portal the title into the dialog header). A consumer that only needs the low-level "in any
// overlay" flag derives it locally as `presentation !== 'page'`.
export type ViewPresentation = 'page' | 'dialog' | 'panel';

// Presentation / overlay surface half of the former `SchemaViewRouterContext`. Schema-agnostic:
// `SchemaViewRouter` supplies these for dialog/panel surfaces, while page surfaces fall back to a
// default derived from the layout (`useLayoutDynamicContext`) — see `useViewPresentation`.
export type ViewPresentationState = {
  presentation: ViewPresentation;
  setTitle: (title: ReactNode) => ReactPortal | undefined;
  // Portals a secondary line under the title into the surface's subtitle slot. Dialog-only for now:
  // a page has no subtitle target, so this returns `undefined` and the subtitle is simply not shown
  // (mirrors `setBottomActions`). In a dialog it portals into the `CustomDialogTitle` subtitle slot.
  setSubtitle: (subtitle: ReactNode) => ReactPortal | undefined;
  setActions: (actions: ReactNode) => ReactPortal | undefined;
  // Portals the view's bottom actions (the form submit/delete bar or a detail's actions) into the
  // surface's footer. On a page there is no footer container, so this returns `undefined` and the
  // caller (`ViewContent`) renders the actions in-flow as a `Toolbar` bar at the bottom of the
  // content frame; in a dialog it portals them into `DialogActions`.
  setBottomActions: (actions: ReactNode) => ReactPortal | undefined;
};
