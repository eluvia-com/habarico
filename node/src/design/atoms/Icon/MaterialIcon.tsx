import React from 'react';
import * as AllIcons from '@mui/icons-material';
import {SvgIconProps} from '@mui/material';
import {IconType} from './enums';
import {ICON_MODIFIERS} from './modifiers';

export type IconProps = SvgIconProps & {
  icon: IconType | string;
  /** Square size in px (sets both width and height). Use `width`/`height` to change the aspect ratio. */
  size?: number;
};

export const MaterialIcon = ({icon, size, width, height, sx, ...rest}: IconProps) => {
  // A curated icon may be derived from another glyph and/or rotated (see ICON_MODIFIERS) — resolve
  // the modifier, then render its `baseIcon` so the transform is owned here, never by the consumer.
  const modifier = ICON_MODIFIERS[icon as IconType];
  const glyph = modifier?.baseIcon ?? icon;
  if (!(glyph in AllIcons)) return null;
  const UsedComponent = AllIcons[`${glyph}Rounded` as keyof typeof AllIcons];
  // `size` sets both dimensions; an explicit `width`/`height` overrides it for a non-square glyph.
  const w = width ?? size;
  const h = height ?? size;
  return (
    <UsedComponent
      {...rest}
      sx={{
        width: w ? `${w}px` : undefined,
        height: h ? `${h}px` : undefined,
        ...(modifier?.rotate ? {transform: `rotate(${modifier.rotate}deg)`} : {}),
        ...sx,
      }}
    />
  );
};
