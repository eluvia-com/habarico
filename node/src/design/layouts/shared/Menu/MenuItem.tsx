import React, {MouseEvent, ReactNode} from 'react';
import {Box, ListItemButton, Tooltip, useTheme} from '@mui/material';
import {RouterLink} from '../../../atoms/RouterLink';
import {varAlpha} from '../../../theme/utils';
import {LayoutMenuItem} from '../../types';

export type MenuItemProps = {
  item: LayoutMenuItem;
  active: boolean;
  collapsed: boolean;
  /** Parent of an open sub-menu: emphasised (dark, bold) but without the active box. */
  highlighted?: boolean;
  /** Sub-menu item (second level and deeper): tighter horizontal padding. */
  sub?: boolean;
  /** Item inside the collapsed-rail dropdown: `md` hover/active radius instead of `lg`. */
  dropdown?: boolean;
  /** Whether the sub-menu of a group is open; announced through `aria-expanded`. */
  expanded?: boolean;
  tooltip?: ReactNode;
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
};

export const MenuItem = ({
  item,
  active,
  collapsed,
  highlighted,
  sub,
  dropdown,
  expanded,
  tooltip,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: MenuItemProps) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  // Active item colours differ per mode (redesign): icon is brighter than the text.
  const activeText = isLight ? theme.palette.primary.dark : theme.palette.primary.light;
  const activeIcon = isLight ? theme.palette.primary.main : theme.palette.primary.lighter;
  // A group only opens its sub-menu; navigation happens on its children. Its `href` stays on the
  // item for custom menus and for matching the active path.
  const isGroup = !!item.items?.length;
  const linkProps = isGroup
    ? {'aria-expanded': !!expanded}
    : {component: RouterLink, href: item.href};
  return (
    <Tooltip title={tooltip} placement={'right'}>
      <ListItemButton
        disableGutters
        {...linkProps}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        // Marks the active row so the shared side glow can slide to it (MenuListFull).
        data-active-item={active ? 'true' : undefined}
        sx={{
          py: 1,
          pl: sub || dropdown ? 1.5 : 2,
          pr: 1.5,
          gap: 2,
          borderRadius: `${dropdown ? theme.radius.md : theme.radius.lg}px`,
          typography: 'body2',
          // Keep items above the absolutely-positioned side glow behind them.
          position: 'relative',
          zIndex: 1,
          fontWeight: 'fontWeightMedium',
          color: theme.palette.text.disabled,
          minHeight: theme.layout?.navItemHeight,
          // Parent of an open sub-menu: emphasised text/icon, no active box.
          ...(highlighted &&
            !active && {
              fontWeight: 'fontWeightSemiBold',
              color: theme.palette.text.primary,
            }),
          ...(active && {
            fontWeight: 'fontWeightSemiBold',
            backgroundColor: varAlpha(theme.palette.primary.mainChannel, isLight ? 0.06 : 0.2),
            color: activeText,
            '&:hover': {
              backgroundColor: varAlpha(theme.palette.primary.mainChannel, isLight ? 0.12 : 0.28),
            },
          }),
        }}
      >
        <Box component="span" sx={{width: 24, height: 24, color: active ? activeIcon : 'inherit'}}>
          {item.icon}
        </Box>

        {!collapsed && (
          <Box component="span" flexGrow={1}>
            {item.title}
          </Box>
        )}

        {!collapsed && item.info && item.info}
      </ListItemButton>
    </Tooltip>
  );
};
