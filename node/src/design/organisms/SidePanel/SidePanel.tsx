import React, {forwardRef} from 'react';
import {Box, SxProps, Theme} from '@mui/material';
import {CloseButton} from '../../atoms/CloseButton';
import {Scrollbar} from '../../atoms/Scrollbar';
import {Panel} from '../../molecules/Panel';
import {SidePanelResizeHandle} from './SidePanelResizeHandle';

export type SidePanelProps = {
  /** Called when the close button is clicked. */
  onClose: () => void;
  /** Panel content — typically a `PanelHeader` followed by a `PanelContent`. */
  children: React.ReactNode;
  /**
   * Pointer-down handler for the left-edge resize handle. When omitted no handle is rendered, so
   * the panel is a static (non-resizable) shell; the host owns the actual resize behaviour and the
   * resulting width (passed via `sx`).
   */
  onResizeStart?: (e: React.PointerEvent) => void;
  /** Extra styles merged onto the outer box — e.g. the width / flex sizing set by the host. */
  sx?: SxProps<Theme>;
};

/**
 * Docked side-panel shell rendered beside a datagrid (a list's inline detail preview). A transparent,
 * lightly-padded box wrapping a `nested` `Panel` for the content, with an absolutely-positioned close
 * button pinned to the top-right corner. Purely presentational: compose `PanelHeader` / `PanelContent`
 * inside, and let the host own `onClose` and the panel's width / placement (via `sx`). When the host
 * passes `onResizeStart` a drag handle appears on the left edge — the host owns the resize behaviour;
 * the shell only renders the affordance. For a floating, backdrop-dimmed variant use `InspectorPanel`.
 *
 * Fills the height of the datagrid it sits beside via `alignSelf: 'stretch'` (it is a flex child of
 * the list's row) and scrolls its content — via an inner `Scrollbar` — when it is taller than the
 * space available next to the grid. No explicit `height` is set: it would disable the stretch and,
 * against the row's flex-sized height, collapse the panel back to its content height. Forwards its
 * ref to the outer box so a resize host can measure the row it sits in.
 */
export const SidePanel = forwardRef<HTMLDivElement, SidePanelProps>(
  ({onClose, children, onResizeStart, sx}, ref) => (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        p: 1,
        alignSelf: 'stretch',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {onResizeStart && <SidePanelResizeHandle onResizeStart={onResizeStart} />}
      <CloseButton
        onClick={onClose}
        sx={{
          // To visually match possible actions in the PanelHeader.
          top: 18,
          right: 18,
        }}
      />
      <Panel variant={'nested'} sx={{flex: 1, minHeight: 0}}>
        {/* height: '100%' (on top of the flexGrow: 1 Scrollbar already sets): SimpleBar decides
            whether its scroll box has a definite height via a float/percentage probe element
            (`.simplebar-height-auto-observer`), not by reading the resolved flex layout directly.
            Sized by flexGrow alone — several flex levels removed from any ancestor with an actual
            `height`, since this box, Panel's Card and SidePanel's own root all size purely via
            flex — that probe flip-flops between "definite" and "auto" from one layout pass to the
            next in Firefox (stable in Chromium). Each flip toggles SimpleBar's content wrapper
            between `height: auto` (collapsed to content) and `height: 100%` (filled), and because
            recalculate() reads the content's scrollHeight *before* writing that style, a flip
            compares a stale scrollHeight against the new wrapper height — spuriously flagging
            overflow for one pass and flashing the scrollbar. An explicit `height: 100%` gives the
            probe an unambiguous definite basis so it never flips. */}
        <Scrollbar fillContent sx={{minHeight: 0, height: '100%'}}>
          {children}
        </Scrollbar>
      </Panel>
    </Box>
  )
);

SidePanel.displayName = 'SidePanel';
