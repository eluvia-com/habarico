/* eslint-disable react/display-name */
import React, {useCallback, useMemo, useState} from 'react';
import {Menu as MuiMenu, MenuProps as MuiMenuProps} from '@mui/material';

type MenuProps = Omit<MuiMenuProps, 'anchorEl' | 'open' | 'onClose'> & {
  onClose?: () => void;
};

export const useMenu = <T = unknown,>() => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [data, setData] = useState<T | undefined>(undefined);
  const [open, setOpen] = useState<boolean>(false);

  const openMenu = useCallback((event: React.MouseEvent<HTMLElement>, data?: T) => {
    setOpen(true);
    setAnchorEl((event.currentTarget || event.target) as HTMLElement);
    setData(data);
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setAnchorEl(null);
    setData(undefined);
  }, []);

  const Menu = useMemo(
    () => (props: MenuProps) => {
      const {children, onClose, ...rest} = props;
      return (
        <MuiMenu
          {...rest}
          anchorEl={anchorEl}
          open={open}
          onClose={() => {
            closeMenu();
            if (onClose) onClose();
          }}
        >
          {children}
        </MuiMenu>
      );
    },
    [anchorEl, closeMenu, open]
  );

  return {Menu, data, openMenu, closeMenu, open};
};
