import {ReactNode, createContext, useCallback, useContext} from 'react';
import {createPortal} from 'react-dom';
import {useLayoutDynamicContext} from '@design/layouts/contexts/LayoutDynamicContext';
import {ViewPresentationState} from './types';

// `undefined` when no `ViewPresentationProvider` is mounted — i.e. a page surface rendered without
// a `SchemaViewRouter`. `useViewPresentation` then falls back to the layout-derived page default.
export const ViewPresentationContext = createContext<ViewPresentationState | undefined>(undefined);

/**
 * Reads the presentation / overlay surface of the current view.
 *
 * - Inside a `ViewPresentationProvider` (dialog / panel via `SchemaViewRouter`) → returns the
 *   provided value (portals into the dialog / panel header, in-overlay `presentation`).
 * - Otherwise (page surface) → a default derived from the layout: `presentation: 'page'`,
 *   `setActions` portals into the header `actionsContainer`, and `setTitle` portals into the
 *   page-level `titleContainer`. Either container may be `undefined` until the layout renders its
 *   target, in which case the setter is a safe no-op.
 */
export function useViewPresentation(): ViewPresentationState {
  const {actionsContainer, titleContainer} = useLayoutDynamicContext();
  const provided = useContext(ViewPresentationContext);

  const setActions = useCallback(
    (actions: ReactNode) => {
      if (!actionsContainer) return;
      return createPortal(actions, actionsContainer);
    },
    [actionsContainer]
  );

  const setTitle = useCallback(
    (title: ReactNode) => {
      if (!titleContainer) return;
      return createPortal(title, titleContainer);
    },
    [titleContainer]
  );

  if (provided) return provided;

  return {
    presentation: 'page',
    setActions,
    setTitle,
    // A page has no subtitle slot — the subtitle is dialog-only, so return `undefined` and let
    // `ViewSubtitle` render nothing on a page.
    setSubtitle: () => undefined,
    // A page has no footer container — bottom actions render in-flow, so signal that by returning
    // `undefined` here and let `ViewContent` fall back to its in-flow `Toolbar` bar.
    setBottomActions: () => undefined,
  };
}
