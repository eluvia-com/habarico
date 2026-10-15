import React from 'react';
import {usePathname} from '@foundation/hooks/usePathname';
import {useRouter} from '@foundation/hooks/useRouter';
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  IconButtonProps,
  MenuItem,
  MenuList,
  Typography,
  menuItemClasses,
} from '@mui/material';
import {usePopover} from '../../hooks/usePopover';
import {useLayoutDynamicContext} from '../contexts/LayoutDynamicContext';
import {LayoutAccountMenuItem} from '../types';

export type AccountPopoverProps = IconButtonProps & {
  menuItems: LayoutAccountMenuItem[];
};

export function AccountPopover({menuItems, sx, ...rest}: AccountPopoverProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {currentUser} = useLayoutDynamicContext();
  const menuItemsWithTag = menuItems.filter((menuItem) => menuItem.tag);
  const menuItemsWithoutTag = menuItems.filter((menuItem) => !menuItem.tag);

  const defaultOnClick = (menuItem: LayoutAccountMenuItem) => {
    if (menuItem.path) router.push(menuItem.path);
  };

  const renderTagButton = (menuItem: LayoutAccountMenuItem) => {
    if (menuItem.tag === 'logout') {
      return (
        <Button
          fullWidth
          color="error"
          size="medium"
          variant="text"
          onClick={() => (menuItem.onClick ? menuItem.onClick(menuItem) : defaultOnClick(menuItem))}
        >
          {menuItem.title}
        </Button>
      );
    } else {
      return null;
    }
  };

  const {Popover, openPopover, closePopover} = usePopover();

  return (
    <>
      <IconButton
        onClick={openPopover}
        sx={{
          p: '2px',
          width: 40,
          height: 40,
          background: (theme) =>
            `conic-gradient(${theme.palette.primary.light}, ${theme.palette.warning.light}, ${theme.palette.primary.light})`,
          ...sx,
        }}
        {...rest}
      >
        <Avatar src={currentUser?.avatar} alt={currentUser?.fullName} sx={{width: 1, height: 1}}>
          {currentUser?.fullName?.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Popover
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
        transformOrigin={{vertical: 'top', horizontal: 'right'}}
        slotProps={{
          paper: {
            sx: {width: 200},
          },
        }}
      >
        <Box sx={{p: 2, pb: 1.5}}>
          {currentUser?.fullName && (
            <Typography variant="subtitle2" noWrap>
              {currentUser?.fullName}
            </Typography>
          )}
          {currentUser?.email && (
            <Typography variant="body2" sx={{color: 'text.secondary'}} noWrap>
              {currentUser?.email}
            </Typography>
          )}
        </Box>

        {menuItemsWithoutTag.length > 0 && (
          <>
            <Divider sx={{borderStyle: 'dashed'}} />
            <MenuList
              sx={{
                // Item padding, gap and radius now come from the `MuiMenuItem` theme override; only
                // the list inset (a bare `MenuList` has no themeable list slot, unlike `Menu`) and
                // the account-menu's muted colour treatment stay local.
                p: 0.5,
                [`& .${menuItemClasses.root}`]: {
                  color: 'text.secondary',
                  '&:hover': {color: 'text.primary'},
                  [`&.${menuItemClasses.selected}`]: {
                    color: 'text.primary',
                    backgroundColor: 'action.selected',
                    fontWeight: 'fontWeightSemiBold',
                  },
                },
              }}
            >
              {menuItemsWithoutTag.map((menuItem) => (
                <MenuItem
                  key={menuItem.title}
                  selected={menuItem.path === pathname}
                  onClick={() => {
                    closePopover();
                    if (menuItem.onClick) menuItem.onClick(menuItem);
                    else defaultOnClick(menuItem);
                  }}
                >
                  {menuItem.icon}
                  {menuItem.title}
                </MenuItem>
              ))}
            </MenuList>
          </>
        )}

        {menuItemsWithTag.length > 0 && (
          <>
            <Divider sx={{borderStyle: 'dashed'}} />
            {menuItemsWithTag.map((menuItem) => (
              <Box key={menuItem.title} sx={{p: 0.5}}>
                {renderTagButton(menuItem)}
              </Box>
            ))}
          </>
        )}
      </Popover>
    </>
  );
}
