import {ViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {ViewModeType} from '@schema/types';

// A view is reachable through a router path only when it is presented inline (`redirect`)
// or carries no explicit mode. `dialog`/`sidepanel` views are opened as overlays from a
// trigger and never get their own route. `mode` never changes the URL, only how the
// view is presented, so routing is gated purely on whether the mode is inline.
export const isRoutedViewMode = (mode?: ViewModeType): boolean => !mode || mode === 'redirect';

// Effective presentation mode for a trigger that opens a view: the trigger's own mode wins,
// otherwise it inherits the target view's default `mode`, falling back to `redirect`.
export const resolveViewMode = (actionMode?: ViewModeType, viewMode?: ViewModeType): ViewModeType =>
  actionMode ?? viewMode ?? 'redirect';

// Presentation mode a view trigger opens in, resolved from the action's own `mode`, the target
// view's default `mode` and whether the trigger fires from inside an overlay (a dialog or side
// panel). An explicit action mode is always honoured; a default gesture (no action mode) follows
// the view's default at top level, but inside an overlay it must not open a nested side panel and
// escapes to a redirect (or a dialog when the view is not routed):
//
//   actionMode set   | any container | -> actionMode           (specific intent respected)
//   actionMode unset  | top level     | -> viewDefaultMode ?? 'redirect'
//   actionMode unset  | in overlay    | -> canRedirect ? 'redirect' : 'dialog'   (escape)
//
// It only picks the mode; the trigger maps it (plus the exact container) onto the final dock /
// dialog / in-place swap / redirect behaviour.
export const resolveEffectiveMode = (
  actionMode: ViewModeType | undefined,
  viewDefaultMode: ViewModeType | undefined,
  inOverlay: boolean,
  canRedirect: boolean
): ViewModeType => {
  if (actionMode) return actionMode;
  if (inOverlay) return canRedirect ? 'redirect' : 'dialog';
  return viewDefaultMode ?? 'redirect';
};

// The surface a view trigger really opens on - the single value that drives both what the trigger
// does and what it renders. On top of `resolveEffectiveMode` it folds in the one thing that can
// still make a mode impossible: `sidepanel` needs a panel to dock into, and without one the view is
// shown in a dialog instead.
//
// The remaining container-specific parts deliberately stay with the trigger, because they change
// nothing about the surface: inside a dialog, swapping the view in place *is* how `dialog` and a
// default `redirect` are performed, and an explicit `redirect` at a view that has no route of its
// own is a contradictory schema the trigger reports and refuses.
export const resolveOpenMode = (
  actionMode: ViewModeType | undefined,
  viewDefaultMode: ViewModeType | undefined,
  presentation: ViewPresentation,
  hasSidePanel: boolean
): ViewModeType => {
  const mode = resolveEffectiveMode(
    actionMode,
    viewDefaultMode,
    presentation !== 'page',
    isRoutedViewMode(viewDefaultMode)
  );
  return mode === 'sidepanel' && !hasSidePanel ? 'dialog' : mode;
};

// The backend contract's `ViewModeType` (`'redirect' | 'dialog' | 'sidepanel'`) and the admin
// layer's `ViewPresentation` (`'page' | 'dialog' | 'panel'`) are the same concept under different,
// wire-level names. Schema components translate here, at the point they read the wire value, so
// that everything below them — the record-link hook, the representation chip and the reference
// fields — speaks the admin vocabulary and carries no schema type.
const VIEW_MODE_TO_PRESENTATION: Record<ViewModeType, ViewPresentation> = {
  redirect: 'page',
  dialog: 'dialog',
  sidepanel: 'panel',
};

export const viewModeToPresentation = (mode?: ViewModeType): ViewPresentation | undefined =>
  mode && VIEW_MODE_TO_PRESENTATION[mode];

const PRESENTATION_TO_VIEW_MODE: Record<ViewPresentation, ViewModeType> = {
  page: 'redirect',
  dialog: 'dialog',
  panel: 'sidepanel',
};

// The same translation the other way, for the record link: its surface is described in the admin
// vocabulary all the way from the field options, but resolving it is a schema decision.
export const presentationToViewMode = (presentation?: ViewPresentation): ViewModeType | undefined =>
  presentation && PRESENTATION_TO_VIEW_MODE[presentation];
