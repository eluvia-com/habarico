import React, {useLayoutEffect, useRef, useState} from 'react';
import {Scrollbar, ScrollbarProps} from './Scrollbar';

// The react-admin pagination bar + bottom page padding are the same on every resource
// (unlike the filter fields above the table, which are schema-driven and vary widely in
// count), so a small constant reserve for them is safe here.
const BOTTOM_RESERVE_PX = 90;
const MIN_HEIGHT_PX = 240;

// The space taken above the table (search box, resource-defined filters, toggles) varies per
// resource and can't be reliably approximated with a fixed `calc(100vh - Npx)` — it ranges
// from none at all to several stacked rows, especially once that row wraps on narrow screens.
// This measures the actual on-screen position of the table's scroll container and derives its
// max height from that, so it adapts to whatever filters a given resource happens to render.
//
// Runs via useLayoutEffect (before paint), so the `calc(100vh - 285px)` rule in listSx.ts is
// only ever visible as a fallback for the rare case this can't run (e.g. no ResizeObserver).
export const ResponsiveScrollbar = ({style, ...props}: ScrollbarProps) => {
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  useLayoutEffect(() => {
    let frame = 0;
    let current: number | undefined;

    const applyIfChanged = (next: number) => {
      // Bail out on negligible deltas: applying `next` changes this element's own height,
      // which can itself shift layout (e.g. the window scrollbar appearing/disappearing as
      // the page crosses the viewport threshold) by a pixel or two — without this guard that
      // shift can retrigger a listener and loop indefinitely.
      if (current !== undefined && Math.abs(current - next) < 2) return;
      current = next;
      setMaxHeight(next);
    };

    const recalculate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = scrollbarRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        applyIfChanged(Math.max(viewportHeight - top - BOTTOM_RESERVE_PX, MIN_HEIGHT_PX));
      });
    };

    recalculate();

    // Deliberately not observing document.body (or any ancestor) with a ResizeObserver here:
    // this element's own maxHeight is derived from — and changes — that ancestor's size, so
    // observing it is self-referential and can loop. Mount + viewport-driven triggers only.
    window.addEventListener('resize', recalculate);
    window.addEventListener('orientationchange', recalculate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', recalculate);
      window.removeEventListener('orientationchange', recalculate);
    };
  }, []);

  const responsiveStyle = maxHeight ? {maxHeight: `${maxHeight}px`} : undefined;
  return <Scrollbar ref={scrollbarRef} style={responsiveStyle ?? style} {...props} />;
};
