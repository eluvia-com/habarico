import React from 'react';
import {Box, InputAdornment, TextField, TextFieldProps} from '@mui/material';
import {Icon, IconType} from '../Icon';

export type SearchFieldProps = Omit<TextFieldProps, 'type'>;

/**
 * A search text input built on the MUI `TextField`. It is a purely visual specialization — a
 * standard text field styled for the search input inside list filters: a filled, mid-grey surface
 * (so it reads as distinct from the paper-coloured filter dropdowns beside it) and a leading search
 * icon set in a white rounded tile. The look holds in both light and dark themes. Accepts every
 * `TextField` prop except `type` (which it controls); a caller-supplied
 * `slotProps.input.startAdornment` overrides the default icon tile.
 */
// The icon tile scales with the input size so it stays proportionally inset on every variant.
// `radius` keys into `theme.radius`; the box hugs the field with a small margin, the icon fills it.
const TILE_BY_SIZE = {
  small: {box: 28, icon: 18},
  medium: {box: 42, icon: 24},
} as const;

export const SearchField = (props: SearchFieldProps) => {
  const {sx, size, ...rest} = props;
  const tile = TILE_BY_SIZE[size === 'small' ? 'small' : 'medium'];
  return (
    <TextField
      {...rest}
      size={size}
      type={'search'}
      sx={[
        (theme) => ({
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.action.selected,
            paddingLeft: theme.spacing(0.75),
          },
          // The mid-grey fill already carries the shape; keep the border transparent so it stays
          // flat. The disabled selector wins over the base rule (the theme's OutlinedInput override
          // restores a `divider` border when disabled), so it needs its own transparent override.
          '& .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline':
            {
              borderColor: 'transparent',
            },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      slotProps={{
        ...props.slotProps,
        input: {
          startAdornment: (
            <InputAdornment position={'start'} sx={{marginRight: 1}}>
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: tile.box,
                  height: tile.box,
                  borderRadius: `${theme.radius.sm}px`,
                  backgroundColor: theme.palette.common.white,
                  color: theme.palette.grey[800],
                })}
              >
                <Icon icon={IconType.Search} size={tile.icon} />
              </Box>
            </InputAdornment>
          ),
          ...props.slotProps?.input,
        },
      }}
    />
  );
};
