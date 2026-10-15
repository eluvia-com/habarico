import React, {ReactNode} from 'react';
import {Box} from '@mui/material';

type RootProps = {
  fill?: boolean;
  children: ReactNode;
};

// A tab panel's body: a growing flex column so the active tab's content (a grid / nested list) can
// fill the height. The tab box surface (card vs card-less) is owned by `BoxLayout` one level up.
export const SchemaTabPanelRoot = ({fill = false, children}: RootProps) => (
  <Box
    sx={{
      pt: 2,
      flexGrow: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      ...(fill && {'& > *': {flexGrow: 1}}),
    }}
    className="SchemaTabPanelRoot"
  >
    {children}
  </Box>
);
