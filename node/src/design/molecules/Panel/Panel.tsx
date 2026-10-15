import React, {useState} from 'react';
import {Box, Card, SxProps, Theme, useTheme} from '@mui/material';
import {InsidePanelContextProvider, useInsidePanel} from '../../contexts/InsidePanelContext';
import {PanelContext, type PanelVariant} from './PanelContext';

export type {PanelVariant};

export type PanelProps = {
  /**
   * Surface style:
   *  - `root`   — 12px corners, `background.paper`, card shadow (top-level shell).
   *  - `nested` — 6px corners, `background.default`, no shadow (sits inside another Panel).
   * When omitted, the variant is derived from context: a Panel rendered inside another
   * Panel is `nested`, otherwise `root` (see `InsidePanelContext`). Pass it explicitly to
   * override the automatic choice.
   */
  variant?: PanelVariant;
  /** When `true`, the panel body can be collapsed via a chevron toggle in its header. */
  collapsible?: boolean;
  /** Uncontrolled initial collapsed state. Defaults to `false` (expanded). Ignored when `collapsed` is set. */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state. Provide together with `onCollapsedChange`. */
  collapsed?: boolean;
  /** Called with the next collapsed value whenever the toggle is clicked. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * When `true`, renders a resize affordance in the bottom-right corner. Presentational
   * only — the Panel implements no resizing (a dashboard wires the actual behaviour).
   */
  resizeHandle?: boolean;
  /**
   * When `true`, the panel stretches to fill its container's height (`height: 100%`) — e.g. to
   * equalise the heights of panels sitting side by side in a grid row. Ignored while collapsed, so
   * a collapsed panel shrinks to its header instead of stretching.
   */
  fullHeight?: boolean;
  /**
   * When `true`, the panel is visually emphasized: a 2px `primary.main` inset outline on the
   * surface (drawn as an inset box-shadow, so it never shifts the panel's size relative to its
   * siblings) and an `action.hover` tint on the header. The emphasis reaches `PanelHeader`
   * through `PanelContext`, so the prop is set once here. Defaults to `false`.
   */
  emphasized?: boolean;
  /** Panel slots — typically `PanelHeader`, `PanelContent`, `PanelFooter`. */
  children: React.ReactNode;
  /** Extra styles merged onto the panel surface. */
  sx?: SxProps<Theme>;
};

/**
 * Standardized panel shell — the single container used to build detail/edit forms,
 * nested lists, dashboard widgets and similar sections, so they share one visual and
 * one behaviour. It is a compound: compose `PanelHeader`, `PanelContent` and
 * `PanelFooter` inside it. The Panel owns only its surface style (root/nested) and the
 * collapse state, which it shares with its slots through `PanelContext`.
 *
 * Purely presentational: the drag and resize affordances are built-in visuals toggled by
 * boolean props — the Panel renders them but implements no drag/grid/resize logic (a
 * dashboard wires the actual behaviour).
 */
export const Panel = ({
  variant,
  collapsible = false,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onCollapsedChange,
  resizeHandle,
  fullHeight = false,
  emphasized = false,
  children,
  sx,
}: PanelProps) => {
  const theme = useTheme();
  // Root by default; a Panel already sitting inside another Panel renders as `nested`.
  // An explicit `variant` prop always wins over the context-derived choice.
  const insidePanel = useInsidePanel();
  const resolvedVariant: PanelVariant = variant ?? (insidePanel ? 'nested' : 'root');
  const isControlled = collapsedProp !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const collapsed = isControlled ? collapsedProp : internalCollapsed;

  const toggle = () => {
    const next = !collapsed;
    if (!isControlled) {
      setInternalCollapsed(next);
    }
    onCollapsedChange?.(next);
  };

  // `root` relies on the Card theme default (12px / paper / card shadow); `nested`
  // tones it down to a flat 6px surface on the default background.
  const nestedSx: SxProps<Theme> =
    resolvedVariant === 'nested'
      ? {
          borderRadius: `${theme.radius.md}px`,
          backgroundColor: 'background.neutral',
          boxShadow: 'none',
        }
      : {};

  // Emphasis draws a 2px `primary.main` outline as an *inset* box-shadow, so it sits inside the
  // surface without enlarging it (a real border would push the panel 2px wider than its grid
  // siblings). For a `root` panel it is layered in front of the base card shadow; a `nested`
  // panel has none, so the outline stands alone.
  const emphasizedSx: SxProps<Theme> = emphasized
    ? {
        boxShadow:
          resolvedVariant === 'nested'
            ? `inset 0 0 0 2px ${theme.palette.primary.main}`
            : `inset 0 0 0 2px ${theme.palette.primary.main}, ${theme.customShadows.card}`,
      }
    : {};

  return (
    <PanelContext.Provider
      value={{variant: resolvedVariant, collapsible, collapsed, toggle, emphasized}}
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          // A collapsed panel shrinks to its header — it should not stretch to fill a grid row.
          ...(fullHeight && !collapsed && {height: '100%'}),
          // `PanelGridItem` stretches its child (`& > * { flex-grow: 1 }`) so side-by-side panels in a
          // row share equal height; a collapsed panel must opt out of that so it shrinks to its header
          // instead of leaving a tall empty card. `&&` out-specifies the parent's `& > *` rule.
          ...(collapsed && {'&&': {flexGrow: 0}}),
          ...nestedSx,
          ...emphasizedSx,
          ...sx,
        }}
      >
        {/* Everything inside a Panel is "inside a card", so a nested Panel auto-selects `nested`. */}
        <InsidePanelContextProvider value={true}>{children}</InsidePanelContextProvider>
        {resizeHandle && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              right: 5,
              bottom: 5,
              width: 12,
              height: 12,
              borderRight: '2px solid',
              borderBottom: '2px solid',
              borderColor: 'text.disabled',
              borderBottomRightRadius: '6px',
              cursor: 'nwse-resize',
            }}
          />
        )}
      </Card>
    </PanelContext.Provider>
  );
};
