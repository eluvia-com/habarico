/* eslint-disable react/display-name */
import React, {useCallback, useMemo, useState} from 'react';
import {Dialog as MuiDialog, DialogProps as MuiDialogProps} from '@mui/material';
import {CustomDialog, CustomDialogProps} from '../../molecules/CustomDialog';

type UseDialogOptions = {
  /**
   * Which dialog surface the returned `Dialog` renders:
   * - `'custom'` (default) — the `CustomDialog` molecule: a MUI `Dialog` with the standardized
   *   floating close button. Compose the body from `CustomDialogTitle` / `DialogContent` /
   *   `DialogActions` children.
   * - `'mui'` — a bare MUI `Dialog` with no auto close button, for callers that compose their own
   *   dismissal affordance.
   */
  variant?: 'custom' | 'mui';
};

// Props of the returned `Dialog` in the default `'custom'` variant — the CustomDialog molecule
// minus the `open`/`onClose` that the hook controls.
type CustomDialogWrapperProps = Omit<CustomDialogProps, 'open' | 'onClose'> & {
  onClose?: () => void;
};

// Props of the returned `Dialog` in the `'mui'` variant — a bare MUI Dialog minus the controlled props.
type MuiDialogWrapperProps = Omit<MuiDialogProps, 'open' | 'onClose'> & {
  onClose?: () => void;
};

export const useDialog = <T = unknown,>({variant = 'custom'}: UseDialogOptions = {}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const openDialog = useCallback((data?: T) => {
    setOpen(true);
    setData(data);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setData(undefined);
  }, []);

  const Dialog = useMemo(() => {
    if (variant === 'mui') {
      return ({children, onClose, ...rest}: MuiDialogWrapperProps) => (
        <MuiDialog
          open={open}
          onClose={() => {
            closeDialog();
            onClose?.();
          }}
          {...rest}
        >
          {children}
        </MuiDialog>
      );
    }

    return ({children, onClose, ...rest}: CustomDialogWrapperProps) => (
      <CustomDialog
        open={open}
        onClose={() => {
          closeDialog();
          onClose?.();
        }}
        {...rest}
      >
        {children}
      </CustomDialog>
    );
  }, [open, closeDialog, variant]);

  return {Dialog, data, openDialog, closeDialog, open};
};
