import React from 'react';
import {useViewportFitHeight} from '../../hooks/useViewportFitHeight';
import {Scrollbar, ScrollbarProps} from './Scrollbar';

// The react-admin pagination bar + bottom page padding are the same on every resource
// (unlike the filter fields above the table, which are schema-driven and vary widely in
// count), so a small constant reserve for them is safe here.
const BOTTOM_RESERVE_PX = 90;
const MIN_HEIGHT_PX = 240;

// The space taken above the table (search box, resource-defined filters, toggles) varies per
// resource, so the max height is measured from the table's on-screen position rather than a fixed
// `calc(100vh - Npx)`. The `calc` rule in listSx.ts is only a fallback for when this cannot run.
export const ResponsiveScrollbar = ({style, ...props}: ScrollbarProps) => {
  const {ref, maxHeight} = useViewportFitHeight({
    bottomReserve: BOTTOM_RESERVE_PX,
    minHeight: MIN_HEIGHT_PX,
  });

  const responsiveStyle = maxHeight ? {maxHeight: `${maxHeight}px`} : undefined;
  return <Scrollbar ref={ref} style={responsiveStyle ?? style} {...props} />;
};
