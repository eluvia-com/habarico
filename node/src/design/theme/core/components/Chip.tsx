import React from 'react';
import {
  CSSObject,
  ChipProps,
  ComponentsVariants,
  Theme,
  ThemeOptions,
  chipClasses,
} from '@mui/material';
import {Icon, IconType} from '../../../atoms/Icon';
import {varAlpha} from '../../utils';
import {COLOR_TYPES, ColorType} from '../palette';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    soft: true;
    text: true;
  }
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

function styleColors(ownerState: ChipProps, styles: (val: ColorType) => CSSObject) {
  return COLOR_TYPES.reduce((acc, color) => {
    if (!ownerState.disabled && ownerState.color === color) {
      acc = styles(color);
    }
    return acc;
  }, {});
}

const softVariant: Record<string, ComponentsVariants<Theme>['MuiChip']> = {
  colors: COLOR_TYPES.map((color) => ({
    props: ({ownerState}) =>
      !ownerState.disabled && ownerState.variant === 'soft' && ownerState.color === color,
    style: ({theme}) => ({
      backgroundColor: varAlpha(theme.palette[color].mainChannel, 0.16),
      [`&.${chipClasses.clickable}:hover`]: {
        backgroundColor: varAlpha(theme.palette[color].mainChannel, 0.32),
      },
      color: theme.palette[color].dark,
      ...theme.applyStyles('dark', {color: theme.palette[color].light}),
    }),
  })),
  inheritColor: [
    {
      props: ({ownerState}) => ownerState.variant === 'soft' && ownerState.color === 'default',
      style: ({theme}) => ({
        color: theme.palette.grey[600],
        backgroundColor: varAlpha(theme.palette.grey['500Channel'], 0.16),
        [`&.${chipClasses.clickable}:hover`]: {
          backgroundColor: varAlpha(theme.palette.grey['500Channel'], 0.32),
        },
      }),
    },
  ],
};

const textVariant: Record<string, ComponentsVariants<Theme>['MuiChip']> = {
  colors: COLOR_TYPES.map((color) => ({
    props: ({ownerState}) =>
      !ownerState.disabled && ownerState.variant === 'text' && ownerState.color === color,
    style: ({theme}) => ({
      backgroundColor: 'transparent',
      transition: 'none',
      [`&.${chipClasses.clickable}:hover`]: {
        backgroundColor: varAlpha(theme.palette[color].mainChannel, 0.12),
        textDecoration: 'underline',
      },
      color: theme.palette[color].dark,
      ...theme.applyStyles('dark', {color: theme.palette[color].light}),
    }),
  })),
  inheritColor: [
    {
      props: ({ownerState}) => ownerState.variant === 'text' && ownerState.color === 'default',
      style: ({theme}) => ({
        color: theme.palette.text.primary,
        backgroundColor: 'transparent',
        transition: 'none',
        [`&.${chipClasses.clickable}:hover`]: {
          backgroundColor: varAlpha(theme.palette.grey['500Channel'], 0.18),
          textDecoration: 'underline',
        },
      }),
    },
  ],
};

export const MuiChip: NonNullable<ThemeOptions['components']>['MuiChip'] = {
  defaultProps: {deleteIcon: <Icon icon={IconType.Cancel} width={20} />},
  variants: [
    ...[...softVariant.inheritColor!, ...softVariant.colors!],
    ...[...textVariant.inheritColor!, ...textVariant.colors!],
  ],
  styleOverrides: {
    root: ({ownerState, theme}): CSSObject => {
      const styled = {
        colors: styleColors(ownerState, (color) => ({
          [`& .${chipClasses.avatar}`]: {
            color: theme.palette[color].lighter,
            backgroundColor: theme.palette[color].dark,
          },
        })),
        disabled: {
          [`&.${chipClasses.disabled}`]: {
            opacity: 1,
            [`& .${chipClasses.avatar}`]: {
              color: theme.palette.action.disabled,
              backgroundColor: theme.palette.action.disabledBackground,
            },
            ...(['outlined'].includes(ownerState.variant!) && {
              color: theme.palette.action.disabled,
              borderColor: theme.palette.action.disabledBackground,
            }),
            ...(['filled', 'soft'].includes(ownerState.variant!) && {
              color: theme.palette.action.disabled,
              backgroundColor: theme.palette.action.disabledBackground,
            }),
            ...(['text'].includes(ownerState.variant!) && {
              color: theme.palette.action.disabled,
              backgroundColor: 'transparent',
            }),
          },
        },
      };
      return {...styled.colors, ...styled.disabled};
    },
    label: ({theme}): CSSObject => ({fontWeight: theme.typography.fontWeightBold}),
    icon: {color: 'currentColor'},
    deleteIcon: {
      opacity: 0.48,
      color: 'currentColor',
      // Keep the delete icon inert on hover/active across every variant and color.
      // MUI's defaults shift its colour per palette (the root `& .deleteIcon:hover`
      // rule plus the filled/outlined per-color variants), which reads inconsistently
      // against our soft/text chips — too light or too dark depending on the color, and
      // vanishing entirely on filled `default`. Pin it back to the resting appearance.
      '&:hover, &:active': {opacity: 0.48, color: 'currentColor'},
    },
    sizeMedium: ({theme}): CSSObject => ({borderRadius: theme.radius.md}),
    sizeSmall: ({theme}): CSSObject => ({borderRadius: theme.radius.md}),
    filled: ({ownerState, theme}): CSSObject => {
      const styled = {
        defaultColor: {
          ...(!ownerState.disabled &&
            ownerState.color === 'default' && {
              color: theme.palette.background.default,
              backgroundColor: theme.palette.text.primary,
              [`& .${chipClasses.avatar}`]: {color: theme.palette.text.primary},
              [`&.${chipClasses.clickable}:hover`]: {backgroundColor: theme.palette.grey[700]},
              ...theme.applyStyles('dark', {
                color: theme.palette.grey[800],
                [`&.${chipClasses.clickable}:hover`]: {backgroundColor: theme.palette.grey[400]},
              }),
            }),
        },
      };
      return {...styled.defaultColor};
    },
    outlined: ({ownerState, theme}): CSSObject => {
      const styled = {
        defaultColor: {
          ...(!ownerState.disabled &&
            ownerState.color === 'default' && {
              borderColor: theme.palette.text.primary, //varAlpha(theme.palette.grey['500Channel'], 0.32),
            }),
        },
      };
      return {...styled.defaultColor, borderWidth: 2};
    },
  },
};
