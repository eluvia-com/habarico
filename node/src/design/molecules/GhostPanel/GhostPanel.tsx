import React, {useEffect, useRef} from 'react';
import {varAlpha} from '@design/theme/utils';
import {Box, Stack, SxProps, Theme, Typography, useTheme} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';

/**
 * Renders the badges row and hides the trailing chips that don't fit inside the ghost frame. It
 * measures overflow on the ghost root (passed via `rootRef`) and, whenever that box resizes, shows
 * every chip then hides them from the end — one whole chip at a time — until the content no longer
 * overflows. Done imperatively (toggling each chip's `display`) so re-fitting never re-renders.
 */
const GhostBadges = ({
  rootRef,
  children,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) => {
  const badgesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const badges = badgesRef.current;
    if (!root || !badges) {
      return;
    }
    const fit = () => {
      const chips = Array.from(badges.children) as HTMLElement[];
      chips.forEach((chip) => (chip.style.display = ''));
      // Hide whole chips from the end while the ghost content overflows its frame (reading the
      // scroll size after each hide forces the reflow that makes the next check accurate).
      for (let i = chips.length - 1; i >= 0; i -= 1) {
        if (root.scrollHeight <= root.clientHeight && root.scrollWidth <= root.clientWidth) {
          break;
        }
        chips[i].style.display = 'none';
      }
    };
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    return () => observer.disconnect();
  }, [rootRef, children]);

  return (
    <Stack
      ref={badgesRef}
      direction={'row'}
      spacing={1}
      useFlexGap
      flexWrap={'wrap'}
      justifyContent={'center'}
      sx={{mt: 1}}
    >
      {children}
    </Stack>
  );
};

export type GhostPanelProps = {
  /** Optional leading icon, shown centered in a soft round badge above the title. */
  icon?: IconType | string;
  /** Title (bold). */
  title: React.ReactNode;
  /** Optional secondary line under the title. */
  subtitle?: React.ReactNode;
  /** Optional wrapping row of badges/chips below the text (e.g. quick-select options). */
  badges?: React.ReactNode;
  /** When set, the whole ghost becomes a button (hover highlight + keyboard activation). */
  onClick?: () => void;
  /** Extra styles merged onto the ghost surface. */
  sx?: SxProps<Theme>;
};

/**
 * A dashed placeholder surface — a centered icon, title, optional subtitle and optional badges,
 * inside a dashed rounded frame that matches the (root) `Panel` corners. Used as an empty-state
 * or a quick "add" affordance (e.g. the add-panel tile in `DashboardGrid`'s edit mode). Fills its
 * container; when `onClick` is set the whole surface acts as a button.
 */
export const GhostPanel = ({icon, title, subtitle, badges, onClick, sx}: GhostPanelProps) => {
  const theme = useTheme();
  const interactive = Boolean(onClick);
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={rootRef}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 3,
        textAlign: 'center',
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: `${theme.radius.lg}px`,
        color: 'text.primary',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 0.2s, background-color 0.2s',
        ...(interactive && {
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: varAlpha(theme.palette.primary.mainChannel, 0.04),
          },
        }),
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 48,
            height: 48,
            // Never let the flex column shrink the badge — that would squash the circle into an
            // ellipse when the ghost is short.
            flexShrink: 0,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            color: 'text.secondary',
          }}
        >
          <Icon icon={icon} width={24} />
        </Box>
      )}
      <Typography variant={'subtitle1'} fontWeight={'fontWeightBold'}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant={'body2'} color={'text.secondary'}>
          {subtitle}
        </Typography>
      )}
      {badges && <GhostBadges rootRef={rootRef}>{badges}</GhostBadges>}
    </Box>
  );
};
