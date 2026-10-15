import {RefObject, useCallback, useLayoutEffect, useRef, useState} from 'react';
import {
  HEADER_ACTIONS_DENSITIES,
  HeaderActionsCompactionOptions,
  HeaderActionsDensity,
  INITIAL_HEADER_ACTIONS_COMPACTION,
  stepHeaderActionsCompaction,
} from './headerActionsDensity';

export type UseHeaderActionsCompactionOptions = Partial<HeaderActionsCompactionOptions> & {
  /** The breadcrumb trail's box — a flex item that shrinks to the room the header leaves it. */
  trailRef: RefObject<HTMLElement | null>;
  /** The right-hand cluster (actions + header icons), which never shrinks. */
  actionsRef: RefObject<HTMLElement | null>;
  /** Off → always `full` (e.g. no breadcrumbs, or a viewport where the trail has its own row). */
  enabled: boolean;
};

const DEFAULT_MIN_TRAIL_WIDTH = 320;
const DEFAULT_HYSTERESIS = 16;

/**
 * Decides how compactly the header renders the current view's actions by measuring the header row
 * itself rather than the viewport: the sidebar, the number of header icons and — above all — the
 * length of the breadcrumb trail all change how much room there is, and a viewport breakpoint sees
 * none of them. A short trail keeps full labelled actions; a long one that would be squeezed under
 * `minTrailWidth` makes them icon-only, then folds them into the `⋮` menu (see
 * {@link stepHeaderActionsCompaction} for the exact rules).
 *
 * The trail, the cluster and the row are watched with a `ResizeObserver`, and the row is re-measured
 * after every density change so the width a step freed is measured, not guessed. Transient
 * measurements live in a ref; only the resulting density is state, so consumers re-render only
 * when it actually changes.
 */
export const useHeaderActionsCompaction = ({
  trailRef,
  actionsRef,
  enabled,
  minTrailWidth = DEFAULT_MIN_TRAIL_WIDTH,
  hysteresis = DEFAULT_HYSTERESIS,
}: UseHeaderActionsCompactionOptions): HeaderActionsDensity => {
  const [density, setDensity] = useState<HeaderActionsDensity>('full');
  const stateRef = useRef(INITIAL_HEADER_ACTIONS_COMPACTION);
  // The level the actions are actually rendered at. A step is only measured once it is on screen —
  // a resize arriving in between would otherwise record a step as having freed nothing.
  const renderedLevelRef = useRef(0);

  const update = useCallback(() => {
    const trail = trailRef.current;
    const actions = actionsRef.current;
    const {pending} = stateRef.current;
    if (!trail || !actions || (pending && pending.level !== renderedLevelRef.current)) return;
    const trailRect = trail.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const next = stepHeaderActionsCompaction(
      stateRef.current,
      {
        trailWidth: trailRect.width,
        freeWidth: Math.max(0, actionsRect.left - trailRect.right),
        actionsWidth: actionsRect.width,
      },
      {minTrailWidth, hysteresis}
    );
    stateRef.current = next;
    setDensity(HEADER_ACTIONS_DENSITIES[next.level]);
  }, [trailRef, actionsRef, minTrailWidth, hysteresis]);

  useLayoutEffect(() => {
    if (!enabled) {
      // Start over when re-enabled; the stale `density` state is masked below until then.
      stateRef.current = INITIAL_HEADER_ACTIONS_COMPACTION;
      return undefined;
    }
    const trail = trailRef.current;
    const actions = actionsRef.current;
    if (!trail || !actions) return undefined;

    update();
    const observer = new ResizeObserver(update);
    observer.observe(trail);
    observer.observe(actions);
    // The row itself: widening the window moves free space around without resizing either side.
    if (trail.parentElement) observer.observe(trail.parentElement);
    return () => observer.disconnect();
  }, [enabled, trailRef, actionsRef, update]);

  // Re-measure once the actions have re-rendered at the new density — records what the step freed
  // and takes the next step right away if one step was not enough.
  const effectiveDensity = enabled ? density : 'full';
  useLayoutEffect(() => {
    renderedLevelRef.current = HEADER_ACTIONS_DENSITIES.indexOf(effectiveDensity);
    if (enabled) update();
  }, [effectiveDensity, enabled, update]);

  return effectiveDensity;
};
