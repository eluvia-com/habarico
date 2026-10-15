import React, {useMemo} from 'react';
import {Grid} from '@mui/material';
import {PanelGridContextProvider} from '../../contexts/PanelGridContext';

export type PanelGridItemProps = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  children?: React.ReactNode;
};

export const PanelGridItem = ({children, ...columns}: PanelGridItemProps) => {
  const {xs = 12, sm = xs, md = sm, lg = md, xl = lg} = columns;

  // Memoized: `PanelGridContextProvider` doesn't memoize its own `value` — a fresh object here on
  // every render invalidates the context for every descendant regardless of whether the column
  // spans actually changed, and every grid cell in the box goes through this.
  const panelGridValue = useMemo(() => ({xs, sm, md, lg, xl}), [xs, sm, md, lg, xl]);

  return (
    <PanelGridContextProvider value={panelGridValue}>
      {/* The grid container stretches items in a row to equal height (`align-items:
          stretch`), but a percentage/`height:100%` child does not resolve against a
          flex-stretched (indefinite-height) item. So make the item a flex column and
          let its content grow — this fills the stretched height, so panels sitting
          side by side in a row are always equally tall.

          The item itself keeps MUI Grid v2's default `flex-grow: 0` (its `size`-based
          width as a fixed flex-basis) so a row that doesn't divide evenly — e.g. a lone
          item wrapping onto its own row — stays at the same width as its siblings above
          it instead of stretching to fill the row. */}
      <Grid
        size={{xs, sm, md, lg, xl}}
        className="PanelGridItem"
        sx={{display: 'flex', flexDirection: 'column', '& > *': {flexGrow: 1}}}
      >
        {children}
      </Grid>
    </PanelGridContextProvider>
  );
};
