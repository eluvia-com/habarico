import type {Theme} from '@mui/material';

export const layout = (theme: Theme) => ({
  // nav
  navZIndex: 1101,
  navMobileWidth: '320px',
  navVerticalWidth: '300px',
  navVerticalCollapsedWidth: '80px',
  navOpacity: 0.5,
  navPt: theme.spacing(2.5),
  navPx: theme.spacing(1.5),
  navLogoHeight: '96px',
  // nav item
  navItemHeight: '44px',
  // header
  headerBlur: '8px',
  headerZIndex: 1100,
  headerMobileHeight: '64px',
  headerDesktopHeight: '72px',
  // 0 = fully transparent app bar; the frosted look comes from headerBlur alone.
  headerOpacity: 0,
  // paper
  paperOpacity: 1.0,
  // content
  contentPt: theme.spacing(2.5),
  contentPb: theme.spacing(2.5),
  contentPx: theme.spacing(2.5),
  contentWidthSm: '420px',
  contentWidthMd: '448px',
});
