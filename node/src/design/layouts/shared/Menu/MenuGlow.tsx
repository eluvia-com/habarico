import React, {useLayoutEffect, useRef, useState} from 'react';
import {usePathname} from '@foundation/hooks/usePathname';
import {Box, useTheme} from '@mui/material';
import {varAlpha} from '../../../theme/utils';

type GlowRect = {top: number; height: number};

/**
 * Soft elliptical glow that illuminates the active menu item from the side. It
 * lives in the sidebar — outside the scrollable menu container — so it is not
 * clipped and can bleed in from the left edge. It tracks the active row (marked
 * with `data-active-item`) and slides smoothly to a newly selected item.
 *
 * The container is derived from the glow's own parent element rather than a ref
 * passed down from the sidebar: a child's layout effect runs before the parent's
 * ref is attached, so on mount that ref would still be null and the glow would
 * only appear after the first navigation.
 */
export const MenuGlow = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const pathname = usePathname();
  const glowRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<GlowRect | null>(null);

  useLayoutEffect(() => {
    const container = glowRef.current?.parentElement;
    if (!container) return;
    const measure = () => {
      const el = container.querySelector<HTMLElement>('[data-active-item="true"]');
      if (!el) {
        setRect((prev) => (prev === null ? prev : null));
        return;
      }
      const containerBox = container.getBoundingClientRect();
      const itemBox = el.getBoundingClientRect();
      const top = itemBox.top - containerBox.top;
      const height = itemBox.height;
      // Keep the same object (no re-render) while nothing actually moved.
      setRect((prev) =>
        prev && prev.top === top && prev.height === height ? prev : {top, height}
      );
    };
    // Re-measure across a short window so the glow settles on the item's *final*
    // position after animated layout shifts (a sibling sub-menu collapsing/expanding
    // moves items only after this runs).
    let raf = 0;
    let frames = 0;
    const tick = () => {
      measure();
      frames += 1;
      if (frames < 36) raf = requestAnimationFrame(tick);
    };
    const settle = () => {
      cancelAnimationFrame(raf);
      frames = 0;
      raf = requestAnimationFrame(tick);
    };
    settle();
    // Re-align on window/sidebar resizes.
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    // Re-align when the active item appears or changes *without* a route change —
    // e.g. menu items loading async, an initially pre-selected item, or toggling
    // the collapsed rail (which swaps the whole menu tree).
    const mutationObserver = new MutationObserver(settle);
    mutationObserver.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-active-item'],
    });
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return (
    <Box
      ref={glowRef}
      aria-hidden
      sx={{
        position: 'absolute',
        // Span the sidebar width (left+right:0) so the glow is clipped to it and
        // never spills onto the content — important for the narrow collapsed rail.
        left: 0,
        right: 0,
        height: 243,
        top: rect ? rect.top + rect.height / 2 : 0,
        transform: 'translateY(-50%)',
        opacity: rect ? 1 : 0,
        pointerEvents: 'none',
        // Behind the (transparent) menu content but above the sidebar background.
        zIndex: -1,
        // Ellipse anchored to the left edge (its left half falls off-screen), so it
        // lights the menu sideways — matching a 353×243 glow bleeding in from the left.
        background: `radial-gradient(176px 121px at 0% 50%, ${varAlpha(
          theme.palette.primary.lighterChannel,
          isLight ? 0.15 : 0.2
        )} 0%, transparent 100%)`,
        // Positioned in a layout effect (pre-paint) so mounting snaps into place;
        // later selection changes slide via this transition.
        transition: theme.transitions.create(['top', 'opacity'], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.standard,
        }),
      }}
    />
  );
};
