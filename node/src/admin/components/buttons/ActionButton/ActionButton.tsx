import React, {ReactElement, ReactNode, cloneElement, isValidElement} from 'react';
import {useTranslate} from 'react-admin';
import {Link as RouterLink, To} from 'react-router-dom';
import {buttonIconPx} from '@design/atoms/Icon';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {useToolbarSlot} from '@design/contexts/ToolbarSlotContext';
import {useConfirm} from '@design/hooks/useConfirm';
import {
  Breakpoint,
  ButtonProps,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  SxProps,
  Theme,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';

/** MUI button colors accepted by {@link ActionButton}. */
export type ActionButtonColor = ButtonProps['color'];

/** Declarative confirmation for an action — resolved (or translation-key) strings. */
export type ActionButtonConfirm = {
  title: string;
  content: string;
  options?: Record<string, unknown>;
};

export type ActionButtonProps = {
  /** Button label. A plain string is auto-translated; a node (e.g. a dynamic-text element) is rendered as-is. */
  label?: ReactNode;
  /** Leading glyph. Rendered as the button's start icon (or the menu-item icon on the `menuItem` surface). */
  icon?: ReactElement;
  /**
   * Which surface to render: a `button` (default), a compact `iconButton` (a MUI `IconButton` — always
   * icon-only, so `showLabel` and `loading` do not apply), or a `menuItem` (for use inside a `Menu`).
   */
  surface?: 'button' | 'iconButton' | 'menuItem';
  /**
   * Label visibility. `true` (default) always shows it; `false` renders an icon-only button (with a
   * tooltip); a breakpoint (e.g. `'sm'`) collapses the label to icon-only below that width. Ignored on
   * the `iconButton` surface (always icon-only).
   */
  showLabel?: boolean | Breakpoint;
  /** MUI button variant. Defaults to MUI's own default (`text`). */
  variant?: 'text' | 'outlined' | 'contained';
  /** Semantic color. */
  color?: ActionButtonColor;
  /**
   * Button size. `small` is the in-row size: it matches the line a read `PropertyItem` row reserves
   * and the height MUI's `small` `IconButton` (a list's row actions) renders at, so a control
   * rendered in a datagrid cell or a detail row sits inside it rather than growing it.
   */
  size?: 'small' | 'medium' | 'large';
  /** Styles merged onto the button root. */
  sx?: SxProps<Theme>;
  /** Shows a spinner, auto-disables the button and darkens a `contained` button while pending. */
  loading?: boolean;
  /** Disabled state. */
  disabled?: boolean;
  /** Explicit tooltip. When omitted, an icon-only button falls back to its (translated) label. */
  tooltip?: ReactNode;
  /** Render as a router link to this location. */
  to?: To;
  /** Stop the click from bubbling (e.g. so it does not select a datagrid row). Defaults to `true`. */
  stopPropagation?: boolean;
  /** Click handler. When `confirm` is set, it runs only after the user confirms. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  /** When set, clicking opens a confirmation dialog; `onClick` runs on confirm. */
  confirm?: ActionButtonConfirm;
  /** Passthrough for concrete/schema buttons (e.g. the resource a schema button targets). */
  resource?: string;
  /** Passthrough success callback used by concrete buttons. */
  onSuccess?: () => void;
  /** Class name forwarded to the button root (used for E2E action selectors). */
  className?: string;
  /** Native button type (e.g. `submit` for form footers). */
  type?: 'button' | 'submit' | 'reset';
};

const coloredSx = (color: ActionButtonColor): SxProps<Theme> =>
  color && color !== 'inherit' ? {color: `${color}.main`} : {};

// Scales the passed icon element to `px` so the glyph tracks the button `size`. Merged via `sx`
// (last, so it wins) — works for both the design `Icon` atom and a raw MUI `SvgIcon`. An array `sx`
// on the icon is dropped (it would break the design `Icon`'s object-spread) — icons rarely carry one.
const sizeIcon = (icon: ReactElement | undefined, px: number): ReactElement | undefined => {
  if (!icon || !isValidElement(icon)) return icon;
  const el = icon as ReactElement<{sx?: SxProps<Theme>}>;
  const prev = el.props.sx;
  const base = prev && !Array.isArray(prev) ? prev : {};
  return cloneElement(el, {sx: {...base, fontSize: px, width: px, height: px}});
};

// Wraps an (icon-only) control in a tooltip when there is a title to show. The `span` lets the
// tooltip attach its listeners even when the control is disabled.
const withOptionalTooltip = (element: ReactElement, title: ReactNode): ReactElement =>
  title != null && title !== '' ? (
    <Tooltip title={title}>
      <span>{element}</span>
    </Tooltip>
  ) : (
    element
  );

// Resolves whether the label is currently visible for a given `showLabel` (a media query drives the
// breakpoint case). Lives in a hook so `useMediaQuery` is always called unconditionally.
const useLabelVisible = (showLabel: ActionButtonProps['showLabel']): boolean => {
  const theme = useTheme();
  const breakpoint = typeof showLabel === 'string' ? showLabel : 'xs';
  const collapsed = useMediaQuery(theme.breakpoints.down(breakpoint));
  if (showLabel === false) return false;
  if (showLabel === undefined || showLabel === true) return true;
  return !collapsed;
};

/**
 * The single admin-layer action button — one surface (`button` / `iconButton` / `menuItem`) with
 * orthogonal behaviours (loading, tooltip, link) and an optional post-click confirm. Replaces the old
 * `BaseButton` + `BaseActionButton` (and the React Admin `Button` override): it builds on the design
 * `LoadingButton` (which supplies the loading overlay/spinner), translates its own label/confirm
 * strings via `useTranslate`, and handles responsive label collapse itself through `showLabel`
 * instead of the removed override.
 */
export const ActionButton = ({
  label,
  icon,
  surface = 'button',
  showLabel = true,
  variant,
  color,
  size,
  sx,
  loading = false,
  disabled,
  tooltip,
  to,
  stopPropagation = true,
  onClick,
  confirm,
  className,
  type,
}: ActionButtonProps) => {
  const translate = useTranslate();
  const {confirm: openConfirm, dialog} = useConfirm();
  // Toolbar-slot hint (from an enclosing `OverflowToolbar`): an overflowed slot forces the `menuItem`
  // surface; an inline slot below the toolbar's breakpoint forces icon-only. Both defer to an explicit
  // prop only where it does not conflict — `inMenu` always wins (a control in the menu must be an item),
  // and a forced-icon-only slot hides the label regardless of `showLabel`. Neutral outside a toolbar.
  const toolbar = useToolbarSlot();
  const resolvedSurface = toolbar.inMenu ? 'menuItem' : surface;
  // A forced-icon-only toolbar hides labels on inline buttons only — a `menuItem` always keeps its
  // label (a label-less menu row is unreadable), including nested submenu items under an icon-only row.
  const resolvedShowLabel = toolbar.iconOnly && resolvedSurface !== 'menuItem' ? false : showLabel;
  const labelVisible = useLabelVisible(resolvedShowLabel);

  const translatedLabel = typeof label === 'string' ? translate(label, {_: label}) : label;
  const hasLabelText = labelVisible && translatedLabel != null && translatedLabel !== '';
  const sizedIcon = sizeIcon(icon, buttonIconPx(size));

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (stopPropagation) event.stopPropagation();
    if (confirm) {
      openConfirm({
        title: translate(confirm.title, {...confirm.options, _: confirm.title}),
        content: translate(confirm.content, {...confirm.options, _: confirm.content}),
        confirmLabel: translate('ra.action.confirm', {_: 'Confirm'}),
        cancelLabel: translate('ra.action.cancel', {_: 'Cancel'}),
        onConfirm: () => onClick?.(event),
      });
    } else {
      onClick?.(event);
    }
  };

  // --- Menu-item surface ---
  if (resolvedSurface === 'menuItem') {
    return (
      <>
        <MenuItem
          onClick={handleClick}
          disabled={loading || disabled}
          className={className}
          sx={coloredSx(color)}
        >
          {sizedIcon && <ListItemIcon sx={coloredSx(color)}>{sizedIcon}</ListItemIcon>}
          {hasLabelText && <ListItemText>{translatedLabel}</ListItemText>}
        </MenuItem>
        {dialog}
      </>
    );
  }

  // --- Icon-button surface ---
  // A compact MUI IconButton: always icon-only, so `showLabel` and `loading` do not apply (the label
  // becomes the tooltip + aria-label). `confirm`, `to`, `color`, `size` and `disabled` still work.
  if (resolvedSurface === 'iconButton') {
    const iconLinkProps = to != null ? {component: RouterLink, to} : {};
    const iconButton = (
      <IconButton
        color={color}
        size={size}
        type={type}
        className={className}
        disabled={disabled}
        onClick={handleClick}
        aria-label={typeof translatedLabel === 'string' ? translatedLabel : undefined}
        sx={sx}
        {...iconLinkProps}
      >
        {sizedIcon}
      </IconButton>
    );
    return (
      <>
        {withOptionalTooltip(iconButton, tooltip ?? translatedLabel)}
        {dialog}
      </>
    );
  }

  // --- Button surface ---
  const linkProps = to != null ? {component: RouterLink, to} : {};

  const button = (
    <LoadingButton
      loading={loading}
      iconOnly={!hasLabelText}
      startIcon={sizedIcon}
      variant={variant}
      color={color}
      size={size}
      type={type}
      className={className}
      disabled={loading || disabled}
      onClick={handleClick}
      sx={sx}
      {...linkProps}
    >
      {hasLabelText ? translatedLabel : null}
    </LoadingButton>
  );

  const tooltipContent = tooltip ?? (!hasLabelText ? translatedLabel : undefined);

  return (
    <>
      {withOptionalTooltip(button, tooltipContent)}
      {dialog}
    </>
  );
};
