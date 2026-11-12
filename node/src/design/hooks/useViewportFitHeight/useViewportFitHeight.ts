import {useLayoutEffect, useRef, useState} from 'react';

export interface UseViewportFitHeightOptions {
  /**
   * Space kept free between the element's bottom and the viewport's bottom edge, in px. Omitted, it
   * is measured: the bottom padding and border of every ancestor, plus what each lays out below.
   */
  bottomReserve?: number;
  /** The smallest height returned, in px. */
  minHeight: number;
  /** Whether to measure at all. Defaults to `true`; when `false`, `maxHeight` is `undefined`. */
  enabled?: boolean;
}

const isInFlow = (element: Element) => {
  const {position} = getComputedStyle(element);
  return position !== 'absolute' && position !== 'fixed';
};

/**
 * The space the page takes below `element`. Siblings beside the branch (grid cells) are skipped, and
 * so is the empty space of an ancestor stretched taller than its content.
 */
const measureSpaceBelow = (element: HTMLElement) => {
  let space = 0;
  let branch: Element = element;
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const branchBottom = branch.getBoundingClientRect().bottom;
    let contentBottom = branchBottom;
    for (const sibling of Array.from(parent.children)) {
      const rect = sibling.getBoundingClientRect();
      if (rect.height > 0 && rect.top >= branchBottom && isInFlow(sibling)) {
        contentBottom = Math.max(contentBottom, rect.bottom);
      }
    }
    const style = getComputedStyle(parent);
    space +=
      contentBottom -
      branchBottom +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderBottomWidth);
    branch = parent;
  }
  return space;
};

/**
 * The height an element may take so it ends above the bottom of the viewport, measured from its
 * on-screen top. It is measured again when the viewport resizes and when the element's own size
 * changes, which covers an element mounted hidden (an inactive tab) and shown later. Attach `ref`
 * to the element and apply `maxHeight` to it.
 */
export const useViewportFitHeight = <T extends HTMLElement = HTMLDivElement>({
  bottomReserve,
  minHeight,
  enabled = true,
}: UseViewportFitHeightOptions) => {
  const ref = useRef<T>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  useLayoutEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let current: number | undefined;

    // Applying a new height can shift the layout by a pixel or two (the window scrollbar appearing
    // or disappearing), which would retrigger the listeners and loop without this guard.
    const applyIfChanged = (next: number) => {
      if (current !== undefined && Math.abs(current - next) < 2) return;
      current = next;
      setMaxHeight(next);
    };

    const recalculate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        // A hidden element (`display: none` on it or an ancestor) has no position to measure.
        if (!el || el.getClientRects().length === 0) return;
        const top = el.getBoundingClientRect().top;
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const reserve = bottomReserve ?? measureSpaceBelow(el);
        applyIfChanged(Math.max(viewportHeight - top - reserve, minHeight));
      });
    };

    recalculate();

    // The element itself is observed, not an ancestor: the result depends on its top only, so its
    // own resize settles after one pass, while an ancestor's size would feed back into itself.
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(recalculate);
    if (ref.current) observer?.observe(ref.current);
    window.addEventListener('resize', recalculate);
    window.addEventListener('orientationchange', recalculate);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', recalculate);
      window.removeEventListener('orientationchange', recalculate);
    };
  }, [enabled, bottomReserve, minHeight]);

  return {ref, maxHeight: enabled ? maxHeight : undefined};
};
