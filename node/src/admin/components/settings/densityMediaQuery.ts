import {Theme} from '@mui/material';

/**
 * Density is honoured on devices with a precise, hover-capable pointer
 * (desktop/laptop — regardless of window size), and on touch devices large in
 * BOTH dimensions (tablets). Phones always stay compact: their shorter side is
 * below `sm` even in landscape, while a width-only breakpoint could not tell a
 * phone in landscape (~930px) from a tablet in portrait (~770px).
 */
export function getDensityMediaQuery(theme: Theme): string {
  const smPx = `${theme.breakpoints.values.sm}px`;
  return `(hover: hover) and (pointer: fine), (min-width: ${smPx}) and (min-height: ${smPx})`;
}
