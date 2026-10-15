import React, {ReactNode} from 'react';
import {Box, Modal, Slide, SxProps, Theme} from '@mui/material';

export type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * The fixed search shell: the `Modal` backdrop plus a `Slide` that drops the search
 * content down from under the header. The content itself (form + results) is supplied
 * via `children` — configured through the layout's `search` slot — while this wrapper
 * stays hardcoded so every consumer gets the same backdrop / slide behaviour.
 */
export const SearchOverlay = ({open, onClose, children, sx}: SearchOverlayProps) => (
  <Modal open={open} onClose={onClose}>
    <Slide direction="down" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={[
          {
            top: 0,
            left: 0,
            zIndex: 99,
            width: '100%',
            position: 'absolute',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    </Slide>
  </Modal>
);
