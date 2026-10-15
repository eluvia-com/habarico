import React from 'react';
import {Box, IconButton, SxProps, Theme} from '@mui/material';
import {Breakpoint, useTheme} from '@mui/material/styles';
import {Icon, IconType} from '../../atoms/Icon';
import {Scrollbar} from '../../atoms/Scrollbar';
import {varAlpha} from '../../theme/utils';
import {Menu, MenuGlow} from '../shared/Menu';
import {WorkspacesPopover} from '../shared/WorkspacesPopover';
import {LayoutWorkspace, LogoSlot, MarketingSlot, MenuSlot, StatusSlot} from '../types';
import {NavFooter} from './NavFooter';

export type NavDesktopProps = {
  logo?: LogoSlot;
  menu?: MenuSlot;
  workspaces?: LayoutWorkspace[];
  marketing?: MarketingSlot;
  status?: StatusSlot;
  layoutBreakpoint: Breakpoint;
  sx?: SxProps<Theme>;
  collapsed?: boolean;
  onToggle: VoidFunction;
};

export function NavDesktop({
  logo,
  menu,
  workspaces,
  marketing,
  status,
  sx,
  layoutBreakpoint,
  collapsed,
  onToggle,
}: NavDesktopProps) {
  const theme = useTheme();

  const LogoComponent = logo?.Component;
  const MenuComponent = menu?.Component ?? Menu;
  const menuItems = menu?.items;

  return (
    <Box
      sx={{
        px: theme.layout?.navPx,
        top: 0,
        left: 0,
        height: 1,
        position: 'fixed',
        flexDirection: 'column',
        background: theme.palette.background.gradient?.subtle,
        zIndex: theme.layout?.navZIndex,
        width: collapsed ? theme.layout?.navVerticalCollapsedWidth : theme.layout?.navVerticalWidth,
        transition: 'width 120ms ease-in-out',
        borderRight: `1px solid ${varAlpha(theme.palette.grey['500Channel'], 0.08)}, ${varAlpha(theme.palette.grey['500Channel'], 0.12)})`,
        display: 'none',
        [theme.breakpoints.up(layoutBreakpoint)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <MenuGlow />
      <IconButton
        onClick={() => onToggle()}
        sx={{
          position: 'absolute',
          right: '-18px',
          bottom: `${parseInt(String(theme.layout?.headerDesktopHeight)) / 2 - 20}px`,
          backgroundColor: theme.palette.background.default,
          '&:hover': {
            backgroundColor: theme.palette.background.default,
          },
        }}
      >
        <Icon icon={IconType.FirstPage} sx={{transform: `rotate(${collapsed ? 180 : 0}deg)`}} />
      </IconButton>
      {LogoComponent && (
        <LogoComponent
          width="100%"
          // Taller logo container; the SVG (preserveAspectRatio) stays centred within it.
          height={theme.layout?.navLogoHeight}
          px={collapsed ? 1 : 3}
          mb={2}
          inverted={theme.palette.mode === 'dark'}
          icon={collapsed}
          href="/"
        />
      )}
      {workspaces && <WorkspacesPopover items={workspaces} sx={{mb: 1.5}} collapsed={collapsed} />}
      <Scrollbar
        fillContent
        sx={{
          minHeight: 120,
          '& .simplebar-scrollbar::before': {
            transition: 'opacity 0.2s ease',
          },
          '&:hover .simplebar-scrollbar::before': {
            opacity: 0.5,
          },
        }}
      >
        {menuItems && <MenuComponent items={menuItems} collapsed={collapsed} />}
      </Scrollbar>
      <NavFooter marketing={marketing} status={status} collapsed={collapsed} />
    </Box>
  );
}
