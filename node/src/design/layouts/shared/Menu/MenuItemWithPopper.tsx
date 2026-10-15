import React, {ReactNode, useCallback, useRef, useState} from 'react';
import {Grow, Paper, Popper} from '@mui/material';
import {MenuItem, MenuItemProps} from './MenuItem';

type MenuItemWithPopperProps = MenuItemProps & {
  children: ReactNode;
};

const POPOVER_OPEN_DEBOUNCE = 250;
// Keep the popper open shortly after leaving so the cursor can bridge the gap
// between the menu item and the submenu (and the initial Grow animation) without
// the submenu closing under it.
const POPOVER_CLOSE_DEBOUNCE = 200;

export const MenuItemWithPopper = ({children, onClick, ...rest}: MenuItemWithPopperProps) => {
  // --------------------------------------------------------------------------
  // State for popper
  // --------------------------------------------------------------------------

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const isOverMenuRef = useRef(false);
  const isOverSubMenuRef = useRef(false);
  const openTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const closeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const closeIfNotOver = useCallback(() => {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      if (!isOverMenuRef.current && !isOverSubMenuRef.current) {
        setAnchorEl(null);
      }
    }, POPOVER_CLOSE_DEBOUNCE);
  }, []);

  const openPopperDebounced = useCallback((e: React.MouseEvent<HTMLElement>) => {
    clearTimeout(closeTimeoutRef.current);
    isOverMenuRef.current = true;
    const target = e.currentTarget as HTMLButtonElement;
    openTimeoutRef.current = setTimeout(() => {
      setAnchorEl(target);
    }, POPOVER_OPEN_DEBOUNCE);
  }, []);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <>
      <MenuItem
        {...rest}
        onMouseEnter={openPopperDebounced}
        onMouseLeave={() => {
          clearTimeout(openTimeoutRef.current);
          isOverMenuRef.current = false;
          closeIfNotOver();
        }}
        onClick={onClick}
      />
      <Popper
        onMouseEnter={() => {
          clearTimeout(closeTimeoutRef.current);
          isOverSubMenuRef.current = true;
        }}
        onMouseLeave={() => {
          isOverSubMenuRef.current = false;
          closeIfNotOver();
        }}
        sx={{zIndex: 1400}}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement={'right-start'}
        modifiers={[
          {
            name: 'preventOverflow',
            options: {
              padding: 8,
            },
          },
          {
            name: 'offset',
            options: {
              // small horizontal gap; the close debounce covers the traversal
              offset: [0, 4],
            },
          },
        ]}
      >
        <Grow in={Boolean(anchorEl)} style={{transformOrigin: '50% 50% 0'}}>
          <Paper elevation={4} sx={{p: 0.5}}>
            {children}
          </Paper>
        </Grow>
      </Popper>
    </>
  );
};
