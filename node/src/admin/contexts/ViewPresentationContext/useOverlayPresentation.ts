import {ReactNode, useMemo} from 'react';
import {createPortal} from 'react-dom';
import {ViewPresentation, ViewPresentationState} from './types';

// The portal targets an overlay surface (dialog / panel) exposes. `title` and `actions` are the
// shared minimum; `subtitle` and `bottomActions` are dialog-only (a panel has no footer/subtitle,
// so it leaves them undefined and those setters become safe no-ops).
export type OverlayPresentationSlots = {
  presentation: Extract<ViewPresentation, 'dialog' | 'panel'>;
  titleEl: HTMLElement | null;
  actionsEl: HTMLElement | null;
  subtitleEl?: HTMLElement | null;
  bottomActionsEl?: HTMLElement | null;
};

const portalTo = (el: HTMLElement | null | undefined) => (node: ReactNode) =>
  el ? createPortal(node, el) : undefined;

/**
 * Builds the `ViewPresentationState` for an overlay surface (dialog / panel) plus setters that
 * portal the view's title / subtitle / actions / bottom-actions into the surface's own slot
 * elements. The single source of the overlay portal wiring — `ViewDialog` and `SchemaSidePanel`
 * both feed it their slot refs so a view portals into whichever surface hosts it.
 */
export const useOverlayPresentation = ({
  presentation,
  titleEl,
  actionsEl,
  subtitleEl,
  bottomActionsEl,
}: OverlayPresentationSlots): ViewPresentationState =>
  useMemo(
    () => ({
      presentation,
      setTitle: portalTo(titleEl),
      setSubtitle: portalTo(subtitleEl),
      setActions: portalTo(actionsEl),
      setBottomActions: portalTo(bottomActionsEl),
    }),
    [presentation, titleEl, actionsEl, subtitleEl, bottomActionsEl]
  );
