import React, {ReactNode, useMemo, useState} from 'react';
import {Box, Tooltip} from '@mui/material';
import {DetectableOverflow} from './DetectableOverflow';
import {ellipsisWithTitleClasses} from './classes';

export type MaxWidthObject = {
  xs: string | number;
  sm: string | number;
  md: string | number;
  lg: string | number;
  xl: string | number;
};

export type EllipsisWithTitleProps = {
  children: ReactNode;
  maxWidth?: number | string | MaxWidthObject;
};

/**
 * Truncates its children with an ellipsis when they overflow `maxWidth`, and reveals the
 * full content in a tooltip — but only while it is actually clipped. Use it to keep long,
 * variable-length labels (breadcrumbs, chips, titles) from pushing their container wider.
 */
export const EllipsisWithTitle = ({children, maxWidth = 200}: EllipsisWithTitleProps) => {
  const [overflow, setOverflow] = useState(false);

  // Memoized because it is `DetectableOverflow`'s `children`, which gates its measurement effect:
  // fresh JSX here would make that effect force a synchronous layout after every render of every
  // ellipsized label, whatever the cause.
  const content = useMemo(
    () => (
      <Tooltip
        title={children}
        disableHoverListener={!overflow}
        disableFocusListener={!overflow}
        disableTouchListener={!overflow}
      >
        <span>{children}</span>
      </Tooltip>
    ),
    [children, overflow]
  );

  return (
    <Box
      className={ellipsisWithTitleClasses.root}
      sx={{
        display: 'inline-block',
        maxWidth: maxWidth,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      <DetectableOverflow onChange={setOverflow}>{content}</DetectableOverflow>
    </Box>
  );
};
