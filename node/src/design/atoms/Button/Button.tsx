import React, {forwardRef} from 'react';
import {Button as MuiButton, ButtonProps as MuiButtonProps, SxProps, Theme} from '@mui/material';

export type ButtonProps = MuiButtonProps & {
  /** Renders the button as a compact, square, label-less icon control. */
  iconOnly?: boolean;
};

// Applied on top of the resolved variant when `iconOnly` is set. The square shape comes from the
// theme's per-size `minWidth` / `minHeight` once the horizontal padding is removed; the icon then
// centers on its own as the button's only child.
const iconOnlySx: SxProps<Theme> = {
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiButton-startIcon, & .MuiButton-endIcon': {marginLeft: 0, marginRight: 0},
};

/**
 * The design-system button: MUI `Button` (styled through the theme) plus the orthogonal `iconOnly`
 * modifier, which is consumed here and never forwarded to the DOM, avoiding React's unknown-prop
 * warning. A control that has to sit inside a row of read data asks for `size="small"` — the theme
 * anchors that size on the height such a control gets, next to a `PropertyItem` line and a list's
 * row actions.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {iconOnly, sx, ...rest},
  ref
) {
  // The modifier first, the caller's `sx` last, so a call site can still override it.
  return (
    <MuiButton
      ref={ref}
      sx={iconOnly ? [iconOnlySx, ...(Array.isArray(sx) ? sx : [sx])] : sx}
      {...rest}
    />
  );
});
