import {Theme} from '@mui/material/styles';

// React Admin wraps a linking field's children in its own `<Link>`. Ours never link at that level —
// the chip inside owns the click — so the anchor styling is unset and only the colour kept, which is
// what makes a linked chip read as a chip rather than as an anchor.
export const recordLinkResetSx = (theme: Theme) => ({
  all: 'unset',
  display: 'inline',
  cursor: 'pointer',
  '& *': {color: theme.palette.primary.main},
});

// The same reset, scoped to React Admin's link class — for a field that passes `sx` to a React Admin
// component rather than styling an element of its own.
export const recordLinkSx = (theme: Theme) => ({'.RaLink-link': recordLinkResetSx(theme)});
