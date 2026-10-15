import React, {ComponentType} from 'react';
import {SvgIconProps, useTheme} from '@mui/material';
import {MaterialIcon} from './MaterialIcon';
import {IconType} from './enums';
import {IconSet} from './types';

export type IconProps = SvgIconProps & {
  icon: IconType | string;
  /** Override the theme's active icon set. Only `material` exists today. */
  iconSet?: IconSet;
  /** Square size in px (sets both width and height). Use `width`/`height` to change the aspect ratio. */
  size?: number;
};

type IconRenderer = ComponentType<SvgIconProps & {icon: IconType | string; size?: number}>;

// Renderer per icon set — the extension point. Add a member to `IconSet` and its renderer
// here (e.g. an Iconify-backed set) to introduce a new set; the record stays exhaustive.
const ICON_SET_RENDERERS: Record<IconSet, IconRenderer> = {
  material: MaterialIcon,
};

// Matches the `createTheme` default. Used when `theme.iconSet` is absent — e.g. under a bare MUI
// theme that lacks the habarico augmentation — so the icon still renders instead of crashing.
const DEFAULT_ICON_SET: IconSet = 'material';

/**
 * The design system's icon primitive: a semantic wrapper keyed by {@link IconType} that renders
 * the glyph from the active icon set. The set comes from `theme.iconSet` (overridable per call
 * via `iconSet`); today only `material` exists (Material Design rounded glyphs). Pass an
 * `IconType` for a curated, named icon or any raw `@mui/icons-material` name; `size` sets a square
 * px size (`width`/`height` size each side independently for a non-square glyph), and
 * `color`/`fontSize`/`sx` behave like a MUI `SvgIcon`.
 */
export const Icon = ({icon, iconSet, ...rest}: IconProps) => {
  const theme = useTheme();
  const Renderer = ICON_SET_RENDERERS[iconSet ?? theme.iconSet ?? DEFAULT_ICON_SET];
  return <Renderer icon={icon} {...rest} />;
};
