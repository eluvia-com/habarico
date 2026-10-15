import React from 'react';
import {Box} from '@mui/material';

export type SidePanelResizeHandleProps = {
  /** Pointer-down handler that starts the drag; the host owns the actual resize behaviour. */
  onResizeStart: (e: React.PointerEvent) => void;
};

/**
 * Private affordance for {@link SidePanel}: an invisible grab strip straddling the panel's left edge
 * that shows a thin accent line on hover / drag. Presentational only — it just forwards the pointer
 * down to the host. Hidden on `xs` (the panel is full-width there, so there is nothing to resize).
 */
export const SidePanelResizeHandle = ({onResizeStart}: SidePanelResizeHandleProps) => (
  <Box
    aria-hidden
    onPointerDown={onResizeStart}
    sx={{
      position: 'absolute',
      left: -4,
      top: 0,
      bottom: 0,
      width: 9,
      zIndex: 1,
      cursor: 'col-resize',
      display: {xs: 'none', md: 'block'},
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: '2px',
        transform: 'translateX(-50%)',
        backgroundColor: 'transparent',
        transition: (theme) => theme.transitions.create('background-color'),
      },
      '&:hover::after, &:active::after': {
        backgroundColor: (theme) => theme.palette.primary.main,
      },
    }}
  />
);
