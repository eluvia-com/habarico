import React from 'react';
import * as MuiIcons from '@mui/icons-material';
import {Icon, IconProps} from '../../atoms/Icon';

// Delegates to the design system's `Icon` primitive so a schema-supplied enum icon name renders
// through the same icon set (and its `Rounded` glyph convention) as every other icon in the
// library, instead of a bespoke lookup that produced a visually different style.
export function resolveEnumIcon(
  iconName: string,
  props?: Record<string, unknown>
): React.ReactElement | null {
  if (!(iconName in MuiIcons)) {
    console.warn(`[habarico] Unknown MUI icon: "${iconName}"`);
    return null;
  }
  return React.createElement(Icon, {icon: iconName, ...props} as IconProps);
}
