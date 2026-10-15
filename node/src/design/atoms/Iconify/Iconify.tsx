import React, {forwardRef} from 'react';
import {Icon, type IconProps} from '@iconify/react';
import {Box, type BoxProps} from '@mui/material';

const baseClassName = 'mnl__icon__root';

export type IconifyProps = BoxProps & IconProps;

export const Iconify = forwardRef<SVGElement, IconifyProps>(
  ({className, width = 20, sx, ...other}, ref) => (
    <Box
      ssr
      ref={ref}
      component={Icon}
      className={baseClassName.concat(className ? ` ${className}` : '')}
      sx={{
        width,
        height: width,
        flexShrink: 0,
        display: 'inline-flex',
        ...sx,
      }}
      {...other}
    />
  )
);

Iconify.displayName = 'Iconify';
