import React from 'react';
import {Box, CircularProgress, SxProps, Theme} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';

export type DragHandleProps = {
  /**
   * While `true`, the grip is replaced by a spinner and the grab cursor is dropped — signalling that
   * a reorder is being committed (e.g. persisted to the backend).
   */
  loading?: boolean;
  /** Accessible label; the handle is otherwise icon-only. */
  'aria-label'?: string;
  /** Grip square size in px. Defaults to 20. */
  size?: number;
  /** Styles merged onto the handle root. */
  sx?: SxProps<Theme>;
};

/**
 * The shared drag affordance — a `DragIndicator` grip used by any surface that reorders via drag
 * (datagrid rows, dashboard panels). Presentational only: it renders the muted grip (or a spinner
 * while a reorder commits) and the `grab` cursor; the actual drag wiring lives on the surrounding
 * draggable element.
 */
export const DragHandle = ({
  loading = false,
  size = 20,
  sx,
  'aria-label': ariaLabel,
}: DragHandleProps) => (
  <Box
    aria-label={ariaLabel}
    sx={[
      {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.disabled',
        cursor: loading ? 'default' : 'grab',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {loading ? (
      <CircularProgress size={size - 4} thickness={5} color={'inherit'} />
    ) : (
      <Icon icon={IconType.DragIndicator} width={size} />
    )}
  </Box>
);
