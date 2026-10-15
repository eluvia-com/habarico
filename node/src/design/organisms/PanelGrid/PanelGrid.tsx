import React from 'react';
import {Grid} from '@mui/material';
import {SxProps, Theme} from '@mui/material/styles';
import {IsLastPanelContextProvider, useIsLastPanel} from '../../contexts/IsLastPanelContext';
import {usePanelGridContext} from '../../contexts/PanelGridContext';
import {PanelGridItem} from './PanelGridItem';
import {usePanelGridSpacing} from './usePanelGridSpacing';

export type PanelGridProps = {
  children?: React.ReactNode;
  maxColumns?:
    | {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
      }
    | number;
  sx?: SxProps<Theme>;
};

// Any future wrapper can opt into this behaviour by setting `.__panelGridPassthrough = true` on itself
const isPreWrapped = (node: React.ReactNode): boolean =>
  React.isValidElement(node) &&
  (node.type === PanelGridItem ||
    !!(node.type as {__panelGridPassthrough?: boolean}).__panelGridPassthrough);

export const PanelGrid = ({children, maxColumns, sx}: PanelGridProps) => {
  const rawItems = React.Children.toArray(children);
  const parentColumns = usePanelGridContext();
  const spacing = usePanelGridSpacing();
  // PanelGrid is the single funnel every panel renders its children through, so
  // it is where the "last path" flag is propagated. Each child learns whether it is
  // the last item of this grid, combined with whether this grid is itself on the
  // last path. Consumers read it via useIsLastPanel to decide whether they may grow
  // to fill height.
  const parentIsLast = useIsLastPanel();
  const lastItemIndex = rawItems.length - 1;

  const columnsXl = typeof maxColumns === 'number' ? maxColumns : maxColumns?.xl || 4;
  const columnsLg = typeof maxColumns === 'number' ? maxColumns : maxColumns?.lg || 3;
  const columnsMd = typeof maxColumns === 'number' ? maxColumns : maxColumns?.md || 2;
  const columnsSm = typeof maxColumns === 'number' ? maxColumns : maxColumns?.sm || 1;
  const columnsXs = typeof maxColumns === 'number' ? maxColumns : maxColumns?.xs || 1;

  const gridItems = rawItems.filter(
    (node) => React.isValidElement(node) && node.type === PanelGridItem
  );

  const autoComputeGridItems = gridItems.length === 0;

  const xl = autoComputeGridItems
    ? Math.max(Math.floor(parentColumns.xl / Math.min(columnsXl, rawItems.length)), 2)
    : undefined;
  const lg = autoComputeGridItems
    ? Math.max(Math.floor(parentColumns.lg / Math.min(columnsLg, rawItems.length)), 3)
    : undefined;
  const md = autoComputeGridItems
    ? Math.max(Math.floor(parentColumns.md / Math.min(columnsMd, rawItems.length)), 3)
    : undefined;
  const sm = autoComputeGridItems
    ? Math.max(Math.floor(parentColumns.sm / Math.min(columnsSm, rawItems.length)), 3)
    : undefined;
  const xs = autoComputeGridItems
    ? Math.max(Math.floor(parentColumns.xs / Math.min(columnsXs, rawItems.length)), 3)
    : undefined;

  const items = rawItems.map((node, i) => {
    const isLast = parentIsLast && i === lastItemIndex;
    const wrapped = isPreWrapped(node) ? (
      node
    ) : (
      <PanelGridItem xl={xl} lg={lg} md={md} sm={sm} xs={xs}>
        {node}
      </PanelGridItem>
    );

    return (
      <IsLastPanelContextProvider key={i} value={isLast}>
        {wrapped}
      </IsLastPanelContextProvider>
    );
  });

  return (
    <Grid container spacing={spacing} columns={parentColumns} className="PanelGrid" sx={sx}>
      {items}
    </Grid>
  );
};
