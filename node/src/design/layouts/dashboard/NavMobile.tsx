import React from 'react';
import {Drawer, IconButton, SxProps, Theme, drawerClasses, useTheme} from '@mui/material';
import {Breakpoint} from '@mui/material/styles';
import {Icon, IconType} from '../../atoms/Icon';
import {Scrollbar} from '../../atoms/Scrollbar';
import {Menu, MenuGlow} from '../shared/Menu';
import {WorkspacesPopover} from '../shared/WorkspacesPopover';
import {
  LayoutMenuItem,
  LayoutWorkspace,
  LogoSlot,
  MarketingSlot,
  MenuSlot,
  StatusSlot,
} from '../types';
import {NavFooter} from './NavFooter';

export type NavMobileProps = {
  logo?: LogoSlot;
  menu?: MenuSlot;
  workspaces?: LayoutWorkspace[];
  marketing?: MarketingSlot;
  status?: StatusSlot;
  layoutBreakpoint: Breakpoint;
  open: boolean;
  onOpen: VoidFunction;
  onClose: VoidFunction;
  sx?: SxProps<Theme>;
};

export function NavMobile({
  logo,
  menu,
  workspaces,
  marketing,
  status,
  layoutBreakpoint,
  open,
  onOpen,
  onClose,
  sx,
}: NavMobileProps) {
  const theme = useTheme();

  const LogoComponent = logo?.Component;
  const MenuComponent = menu?.Component ?? Menu;
  const menuItems = menu?.items;

  const handleCloseForLeaf = (item: LayoutMenuItem) => {
    if (!item.items || item.items.length === 0) {
      onClose();
    }
  };

  return (
    <>
      <IconButton
        onClick={onOpen}
        sx={{
          ml: -1,
          [theme.breakpoints.up(layoutBreakpoint)]: {display: 'none'},
        }}
      >
        <Icon icon={IconType.MenuOpen} />
      </IconButton>
      <Drawer
        open={open}
        onClose={onClose}
        sx={{
          [`& .${drawerClasses.paper}`]: {
            pt: theme.layout?.navPt,
            px: theme.layout?.navPx,
            overflow: 'unset',
            background: theme.palette.background.gradient?.subtle,
            width: theme.layout?.navMobileWidth,
            ...sx,
          },
        }}
      >
        <MenuGlow />
        {LogoComponent && (
          <LogoComponent
            width="100%"
            height={theme.layout?.navLogoHeight}
            px={3}
            mb={2}
            inverted={theme.palette.mode === 'dark'}
            href="/"
          />
        )}
        {workspaces && <WorkspacesPopover items={workspaces} sx={{mb: 1.5}} />}
        <Scrollbar fillContent>
          {menuItems && <MenuComponent items={menuItems} onItemClick={handleCloseForLeaf} />}
        </Scrollbar>
        <NavFooter marketing={marketing} status={status} />
      </Drawer>
    </>
  );
}
