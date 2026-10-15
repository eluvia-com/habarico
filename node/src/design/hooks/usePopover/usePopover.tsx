/* eslint-disable react/display-name */
import React, {useCallback, useMemo, useState} from 'react';
import {Box, Popover as MuiPopover, PopoverProps as MuiPopoverProps} from '@mui/material';

export const usePopover = <T = unknown,>() => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [data, setData] = useState<T | undefined>(undefined);
  const [open, setOpen] = useState<boolean>(false);

  const openPopover = useCallback((event: React.MouseEvent<HTMLElement>, data?: T) => {
    setOpen(true);
    setAnchorEl((event.currentTarget || event.target) as HTMLElement);
    setData(data);
  }, []);

  const preparePopover = useCallback((event: React.MouseEvent<HTMLElement>, data?: T) => {
    setAnchorEl((event.currentTarget || event.target) as HTMLElement);
    setData(data);
  }, []);

  const openAfterPreparePopover = useCallback(() => {
    setOpen(true);
  }, []);

  const closePopover = useCallback(() => {
    setOpen(false);
    setAnchorEl(null);
    setData(undefined);
  }, []);

  const Popover = useMemo(
    () => (props: Omit<MuiPopoverProps, 'anchorEl' | 'open' | 'onClose'>) => {
      const {children, ...rest} = props;
      if (anchorEl) {
        if (open) {
          return (
            <MuiPopover {...rest} anchorEl={anchorEl} open={open} onClose={closePopover}>
              {children}
            </MuiPopover>
          );
        } else {
          return <Box sx={{display: 'none'}}>{children}</Box>;
        }
      } else {
        return <></>;
      }
    },
    [anchorEl, open, closePopover]
  );

  return {
    Popover,
    data,
    openPopover,
    preparePopover,
    openAfterPreparePopover,
    closePopover,
    open,
  };
};
