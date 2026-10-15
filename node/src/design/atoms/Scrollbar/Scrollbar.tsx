import React, {CSSProperties, ReactNode, forwardRef, useEffect, useRef} from 'react';
import type SimpleBarCore from 'simplebar-core';
import SimpleBar, {Props as SimpleBarProps} from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import {Box, SxProps, Theme, useTheme} from '@mui/material';
import {scrollbarClasses} from './classes';

export type ScrollbarProps = SimpleBarProps & {
  sx?: SxProps<Theme>;
  children?: ReactNode;
  fillContent?: boolean;
  slotProps?: {
    wrapper?: SxProps<Theme>;
    contentWrapper?: SxProps<Theme>;
    content?: Partial<SxProps<Theme>>;
  };
};

export const Scrollbar = forwardRef<HTMLDivElement, ScrollbarProps>(
  ({slotProps, children, fillContent, sx, ...other}, ref) => {
    const theme = useTheme();
    const instanceRef = useRef<SimpleBarCore | null>(null);

    // SimpleBar decides whether a horizontal scrollbar is needed from its ResizeObserver (which
    // only sees the fixed-width scroll box, never the wider content inside it) and a
    // MutationObserver that deliberately watches childList/characterData but NOT attributes. So
    // when a child grows purely through an inline style change — e.g. resizing a datagrid column,
    // which just rewrites a `--field-*` CSS variable — none of SimpleBar's triggers fire and the
    // horizontal scrollbar never appears until an unrelated event forces a recalc (or a reload).
    // Bridge that gap: watch for style mutations inside the scroll area and, when they actually
    // change the scroll width, ask SimpleBar to recalculate.
    useEffect(() => {
      const instance = instanceRef.current;
      const scrollEl = instance?.getScrollElement();
      if (!instance || !scrollEl || typeof MutationObserver === 'undefined') return;

      let frame = 0;
      let lastScrollWidth = scrollEl.scrollWidth;

      const check = () => {
        frame = 0;
        const scrollWidth = scrollEl.scrollWidth;
        if (scrollWidth === lastScrollWidth) return;
        lastScrollWidth = scrollWidth;
        instance.recalculate();
      };

      const observer = new MutationObserver(() => {
        // Coalesce bursts (a drag fires many style writes) into one width check per frame.
        if (!frame) frame = requestAnimationFrame(check);
      });
      observer.observe(scrollEl, {attributes: true, subtree: true, attributeFilter: ['style']});

      return () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      };
    }, []);

    return (
      <Box
        component={SimpleBar}
        ref={instanceRef}
        scrollableNodeProps={{ref}}
        clickOnTrack={false}
        className={scrollbarClasses.root}
        sx={{
          minWidth: 0,
          minHeight: 0,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          '& .simplebar-wrapper': slotProps?.wrapper as CSSProperties,
          '& .simplebar-content-wrapper': slotProps?.contentWrapper as CSSProperties,
          '& .simplebar-content': {
            ...(fillContent && {
              minHeight: 1,
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
            }),

            ...slotProps?.content,
          } as CSSProperties,
          // The horizontal scrollbar track (11px tall) is an overlay pinned to the bottom of the
          // scroll area, so it covers the last row. Reserve matching space at the end of the
          // content only while the x axis actually scrolls (SimpleBar toggles `simplebar-scrollable-x`
          // on the root), so the scrollbar sits below the last row instead of on top of it.
          // `!important` overrides the inline `padding` SimpleBar writes on this element.
          '&.simplebar-scrollable-x .simplebar-content': {
            paddingBottom: '11px !important',
          },
          '& .simplebar-scrollbar::before,& .simplebar-scrollbar.simplebar-visible::before,& .simplebar-scrollbar:hover::before':
            {
              background: theme.palette.text.secondary,
            },
          // Keep the scrollbar visible the whole time the pointer is over the scroll area,
          // instead of letting SimpleBar's autoHide timer fade it out after a couple of seconds.
          // SimpleBar only renders a scrollbar when the axis actually overflows, so this shows
          // nothing when scrolling isn't needed. Override the transition too: SimpleBar's default
          // `::before` rule carries a 0.5s delay, which would otherwise stall the appearance on
          // hover — drop the delay so it shows immediately.
          '&:hover .simplebar-scrollbar::before': {
            opacity: 0.5,
            transition: 'opacity 0.15s linear',
          },
          ...sx,
        }}
        {...other}
      >
        {children}
      </Box>
    );
  }
);

Scrollbar.displayName = 'Scrollbar';
