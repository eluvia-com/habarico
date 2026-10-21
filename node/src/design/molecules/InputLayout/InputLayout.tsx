import React, {ReactNode} from 'react';
import {Box, FormHelperText} from '@mui/material';
import type {SxProps, Theme} from '@mui/material/styles';

export type InputLayoutProps = {
  /** Legend label rendered in the notch of the frame. `false` / nullish hides the legend. */
  label?: ReactNode;
  /** The field control — typically a custom widget with no MUI outline of its own. */
  children: ReactNode;
  /**
   * Helper / validation text under the frame. In the admin layer this is usually a React Admin
   * `<InputHelperText>` node, so the sentinel-decoding / translation stays out of the design layer.
   */
  helperText?: ReactNode;
  /** Error state — reddens the frame border, legend and helper text. */
  error?: boolean;
  /** Disabled / read-only — suppresses the hover highlight. */
  disabled?: boolean;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
};

/**
 * The outlined "fieldset frame + legend label + helper text" chrome that MUI's outlined `TextField`
 * renders for free — extracted so inputs wrapping a *custom* widget (one with no MUI outline of its
 * own, e.g. `TreeSelect`, `UploadArea`) get the same field look and states (hover, focus-within,
 * error). Purely presentational and React-Admin-free: the caller supplies the control as `children`
 * and, typically, an `<InputHelperText>` node as `helperText`.
 */
export const InputLayout = ({
  label,
  children,
  helperText,
  error = false,
  disabled = false,
  fullWidth = false,
  sx,
}: InputLayoutProps) => {
  // An empty string is treated as no label: rendering an empty `<legend>` would still cut a notch
  // into the top border (native fieldset behaviour) even with nothing to show.
  const showLegend = label != null && label !== false && label !== '';

  return (
    <Box
      sx={[
        // `fit-content` (not `undefined`) so `fullWidth={false}` actually shrinks to the control's
        // width — a plain block `Box` fills its container regardless, making the toggle a no-op.
        {width: fullWidth ? '100%' : 'fit-content'},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="fieldset"
        sx={(theme) => ({
          m: 0,
          minWidth: 0,
          border: 1,
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 1,
          px: 1,
          pt: 0.5,
          pb: 1,
          // The `-6px` only seats the legend across the top border; with no legend (the label is
          // owned by a surrounding `PropertyItem`, e.g. the stacked layout) there's nothing to seat,
          // so drop it — otherwise it pulls the frame up and misaligns it against the label above.
          mt: showLegend ? '-6px' : 0,
          transition: theme.transitions.create('border-color'),
          '&:hover': disabled || error ? {} : {borderColor: theme.palette.text.primary},
          '&:focus-within': {
            borderColor: error ? 'error.main' : 'primary.main',
            borderWidth: 2,
            // The focus border grows 1px thicker on every side; trim that pixel back out of the
            // padding so nothing shifts. It has to be a real (notched) border — an outline or
            // box-shadow fake draws a line straight across the legend's notch. The notched top edge
            // is governed by the legend (far taller than the border), so its growth doesn't move the
            // content and `pt` must stay put; only the sides and bottom need compensating. With no
            // legend the top is a plain border, so it's trimmed too.
            px: `calc(${theme.spacing(1)} - 1px)`,
            pb: `calc(${theme.spacing(1)} - 1px)`,
            ...(showLegend ? {} : {pt: `calc(${theme.spacing(0.5)} - 1px)`}),
          },
        })}
      >
        {showLegend && (
          <Box
            component="legend"
            sx={{
              px: 0.75,
              fontSize: '0.75rem',
              lineHeight: 1,
              color: error ? 'error.main' : 'text.secondary',
            }}
          >
            {label}
          </Box>
        )}
        {children}
      </Box>
      {helperText != null && helperText !== false && (
        <FormHelperText error={error} sx={{mx: 2, mt: 0.5}}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};
