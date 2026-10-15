import React from 'react';
import {IconButton, IconButtonProps} from '@mui/material';
import {Icon, IconType} from '../Icon';

export type CloseButtonProps = IconButtonProps;

/**
 * Absolutely-positioned close (×) button pinned to the top-right corner of its
 * positioned container. Shared by dialogs, the inspector panel and any other
 * dismissible surface so the affordance looks and sits identically everywhere.
 */
export const CloseButton = ({sx, ...rest}: CloseButtonProps) => (
  <IconButton
    aria-label={'close'}
    {...rest}
    // Array form, not a spread: `SxProps` is just as legally an array or a theme callback as it is
    // a plain object, and spreading either of those into this one copies nothing — a caller's
    // styles disappeared without a word. The array keeps every form, caller's last, so it wins.
    sx={[
      {
        position: 'absolute',
        right: 10,
        top: 10,
        p: 0.5,
        display: 'flex',
        cursor: 'pointer',
        zIndex: 10,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Icon icon={IconType.Close} width={20} height={20} />
  </IconButton>
);
