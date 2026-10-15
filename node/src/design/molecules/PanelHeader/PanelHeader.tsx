import React from 'react';
import type {ColorType} from '@design/theme/core';
import {varAlpha} from '@design/theme/utils';
import {
  Box,
  CardHeader,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  SxProps,
  Theme,
  Tooltip,
  Typography,
  chipClasses,
  useTheme,
} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';
import {DragHandle} from '../DragHandle';
import {usePanelContext} from '../Panel/PanelContext';
import {PANEL_DRAG_HANDLE_CLASS} from './constants';

// Every header element sits in a line box of this height. With a single-line label the
// row is one line box tall (so the content is vertically centred); when the label wraps,
// only the label grows and the other elements stay pinned to the first line.
const LINE_BOX = 32;

// Shared line-box: a fixed-height, vertically-centred, non-shrinking flex cell.
const lineBoxSx: SxProps<Theme> = {
  height: LINE_BOX,
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
};

// The leading icon: a soft tinted rounded-square badge (`iconBadge`) or a bare colored glyph.
// Extracted so its branching stays out of `PanelHeader`'s body.
const PanelHeaderIcon = ({
  icon,
  iconColor,
  iconBadge,
}: {
  icon: IconType | string;
  iconColor: ColorType;
  iconBadge: boolean;
}) => {
  const theme = useTheme();

  if (iconBadge) {
    // On its tinted badge the glyph needs the darker shade for contrast in light mode.
    const badgeGlyphColor = `${iconColor}.${theme.palette.mode === 'dark' ? 'main' : 'dark'}`;
    return (
      <Box
        sx={{
          ...lineBoxSx,
          justifyContent: 'center',
          width: LINE_BOX,
          borderRadius: `${theme.radius.sm}px`,
          bgcolor: varAlpha(theme.palette[iconColor].mainChannel, 0.12),
          color: badgeGlyphColor,
        }}
      >
        <Icon icon={icon} width={20} />
      </Box>
    );
  }

  // Bare glyph (e.g. a dashboard widget's colored dot): a small mark in the color's `main` shade.
  return (
    <Box sx={{...lineBoxSx, color: `${iconColor}.main`}}>
      <Icon icon={icon} width={20} />
    </Box>
  );
};

// A status indicator: a soft `Chip` holding a colored icon, with the status text revealed in a
// tooltip to save space — the same soft-chip treatment as `EnumChip`, collapsed to icon-only.
// The empty label span is hidden and the glyph centered so the chip hugs the icon; the outer `Box`
// keeps it vertically centred in the header's line box (a small chip is shorter than the row).
const PanelHeaderStatus = ({label, color, icon}: PanelStatus) => (
  <Tooltip title={label} arrow>
    <Box component={'span'} sx={lineBoxSx}>
      <Chip
        size={'small'}
        variant={'soft'}
        color={color}
        icon={<Icon icon={icon} width={14} />}
        sx={{
          px: 0.75,
          [`& .${chipClasses.label}`]: {display: 'none'},
          [`& .${chipClasses.icon}`]: {m: 0},
        }}
      />
    </Box>
  </Tooltip>
);

// The collapse toggle rendered when the owning `Panel` is `collapsible`. Extracted so its
// collapsed-state branching stays out of `PanelHeader`'s body.
const CollapseToggle = ({collapsed, toggle}: {collapsed: boolean; toggle: () => void}) => (
  <IconButton
    onClick={toggle}
    size={'small'}
    aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
  >
    <Icon
      icon={IconType.ChevronRight}
      width={20}
      sx={{
        // Rotate 90°: collapsed points right, expanded points down.
        transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
        transition: 'transform 0.2s',
      }}
    />
  </IconButton>
);

/**
 * A status indicator shown next to the label: a soft tinted chip holding a colored icon, with the
 * status text revealed in a tooltip on hover (so it stays compact).
 */
export type PanelStatus = {
  /** Tooltip text describing the status. */
  label: React.ReactNode;
  /** Semantic palette color for the soft tint and icon. */
  color: ColorType;
  /** Icon glyph shown in the chip. */
  icon: IconType | string;
};

export type PanelHeaderProps = {
  /** Header title. */
  label: React.ReactNode;
  /** Optional leading icon, tinted with `iconColor`, shown before the label. */
  icon?: IconType | string;
  /** Semantic palette color for the leading icon (and its badge tint). Defaults to `primary`. */
  iconColor?: ColorType;
  /**
   * When `true` (default) the leading icon sits in a soft tinted rounded-square badge;
   * when `false` it is rendered as a bare colored icon.
   */
  iconBadge?: boolean;
  /** Optional help content — shows a help icon after the label with this text in a tooltip. */
  help?: React.ReactNode;
  /**
   * Optional status indicator — a soft tinted chip with a colored icon shown after the label;
   * its `label` is revealed in a tooltip to save space.
   */
  status?: PanelStatus;
  /** Optional actions rendered on the right (e.g. buttons / an overflow menu). */
  actions?: React.ReactNode;
  /** When `true`, renders a drag affordance at the far left (presentational; wired by a dashboard). */
  dragHandle?: boolean;
  /**
   * When `true`, an indeterminate progress bar overlays the header's bottom edge to signal a
   * background operation. It is an absolute overlay — it never shifts the title, actions or body —
   * and defaults to `false`. Works in both `root` and `nested` panels and with any header content.
   */
  loading?: boolean;
  /** Extra styles merged onto the header row. */
  sx?: SxProps<Theme>;
};

/**
 * Panel header — a leading (optional) icon, the label, an optional help tooltip and a
 * right-aligned actions slot. When the surrounding `Panel` is `collapsible` it also
 * renders the collapse toggle. Must be rendered inside a `Panel`. Built on MUI `CardHeader`.
 *
 * Layout: every element occupies at least a {@link LINE_BOX}px line box and the row is
 * top-aligned, so the header keeps that as its minimum height regardless of icon / actions
 * when the label fits on one line — a taller action (e.g. a labelled button rather than an
 * icon button) grows the line box instead of overflowing it — and grows further (with the
 * icon/actions pinned to the first line) once the label wraps.
 * Vertical padding is `8px`; the left gutter is `8px` when the row starts with a badged icon or a
 * drag handle and `16px` for a bare text label or a bare (un-badged) icon (both need the extra
 * space to breathe); the right gutter mirrors that against the trailing controls.
 */
export const PanelHeader = ({
  label,
  icon,
  iconColor = 'primary',
  iconBadge = true,
  help,
  status,
  actions,
  dragHandle,
  loading = false,
  sx,
}: PanelHeaderProps) => {
  const {collapsible, collapsed, toggle, emphasized} = usePanelContext();

  const leadingIcon = icon ? (
    <PanelHeaderIcon icon={icon} iconColor={iconColor} iconBadge={iconBadge} />
  ) : null;

  const collapseToggle = collapsible ? (
    <CollapseToggle collapsed={collapsed} toggle={toggle} />
  ) : null;

  // A badged leading icon (which fills the line box) or a drag handle tightens the left gutter
  // to 8px; trailing controls tighten the right gutter the same way. A bare text label — and a
  // bare (un-badged) icon, whose small glyph needs the room to breathe — keeps the 16px gutter.
  const compactLeft = Boolean(dragHandle) || (Boolean(icon) && iconBadge);
  const compactRight = Boolean(actions) || Boolean(collapseToggle);

  return (
    // Positioning context for the loading overlay, pinned to the header's bottom edge. The wrapper
    // adds no box of its own, so it never affects the header's size or the panel's flex layout.
    <Box sx={{position: 'relative'}}>
      <CardHeader
        disableTypography
        className={dragHandle ? PANEL_DRAG_HANDLE_CLASS : undefined}
        title={
          <Stack direction={'row'} spacing={1} alignItems={'flex-start'} sx={{minWidth: 0}}>
            {dragHandle && <DragHandle sx={lineBoxSx} />}
            {leadingIcon}
            <Typography
              variant={'subtitle1'}
              fontWeight={'fontWeightBold'}
              sx={{minWidth: 0, lineHeight: `${LINE_BOX}px`}}
            >
              {label}
            </Typography>
            {help && (
              <Tooltip title={help} arrow>
                <Box component={'span'} sx={{...lineBoxSx, cursor: 'help', color: 'text.disabled'}}>
                  <Icon icon={IconType.Help} width={18} />
                </Box>
              </Tooltip>
            )}
            {status && (
              <PanelHeaderStatus label={status.label} color={status.color} icon={status.icon} />
            )}
          </Stack>
        }
        action={
          actions || collapseToggle ? (
            <Stack direction={'row'} spacing={0.5} alignItems={'center'} sx={{minHeight: LINE_BOX}}>
              {actions}
              {collapseToggle}
            </Stack>
          ) : undefined
        }
        sx={{
          alignItems: 'flex-start',
          pt: 1,
          pb: 1,
          pl: compactLeft ? 1 : 2,
          pr: compactRight ? 1 : 2,
          // Emphasized panels tint their header to set it apart from the body (the surface outline
          // is drawn by `Panel`). Flows in from `PanelContext`, so the prop is set once on `Panel`.
          ...(emphasized && {backgroundColor: 'action.hover'}),
          // When the panel is collapsed the header sits on the panel's bottom edge, so drop
          // its dashed divider (which otherwise reads as a stray line under a closed panel).
          borderBottom: collapsible && collapsed ? 'none' : undefined,
          '& .MuiCardHeader-content': {minWidth: 0},
          '& .MuiCardHeader-action': {m: 0, alignSelf: 'flex-start'},
          // Header icon buttons (actions / drag / collapse) fill the line box exactly so they match
          // the header rhythm — handled here so consumers never have to think about it. (Keeping the
          // glyph square is now the `MuiIconButton` theme override's job, not ours.)
          '& .MuiIconButton-root': {width: LINE_BOX, height: LINE_BOX},
          ...sx,
        }}
      />
      {/*
        Loading affordance — a slim indeterminate bar pinned to the header's bottom edge. It is an
        absolute overlay, so toggling `loading` never shifts the title, actions or body; it fades
        between states rather than popping and uses the theme's `primary` color (tracking light/dark),
        mirroring the datagrid's loading bar. `aria-hidden` while idle keeps it out of the a11y tree.
      */}
      <LinearProgress
        aria-hidden={!loading}
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          opacity: loading ? 1 : 0,
          transition: 'opacity 150ms linear',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};
