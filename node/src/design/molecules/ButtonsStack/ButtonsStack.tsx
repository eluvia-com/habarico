import React from 'react';
import type {ColorType} from '@design/theme/core';
import {
  Breakpoint,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  SxProps,
  Theme,
  Tooltip,
} from '@mui/material';
import {Button} from '../../atoms/Button';
import {Icon, IconType, buttonIconPx} from '../../atoms/Icon';
import {useMenu} from '../../hooks/useMenu';
import {ResponsiveCount, useOverflowCount} from '../../hooks/useOverflowCount';

/** Semantic color of a button; buttons frequently use MUI's neutral `inherit`. */
export type ButtonColor = ColorType | 'inherit';

/** Button variant for the expanded buttons (icon-only is the orthogonal `iconOnly` prop). */
export type ButtonsStackVariant = 'contained' | 'outlined' | 'text';

/** Which element backs the expanded buttons — mirrors the admin button's `surface`. */
export type ButtonsStackSurface = 'button' | 'iconButton';

/** A single button — expanded when it fits, a menu item when it overflows into the `⋮` menu. */
export interface ButtonDefinition {
  /** Button/menu-item text; also the tooltip title (and aria-label when it is a string). */
  label: React.ReactNode;
  /**
   * Leading/only glyph. An {@link IconType} or a raw `@mui/icons-material` name. Optional for labeled
   * buttons and menu items; required in practice for the icon-only renderings (`iconOnly` or
   * `surface='iconButton'`).
   */
  icon?: IconType | string;
  /** Click handler. In the overflow menu, `ButtonsStack` calls this then closes the menu. */
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  /** Semantic color; tints the button and (in overflow) the menu item + its icon. Defaults to `inherit`. */
  color?: ButtonColor;
  /** Disabled state for both the expanded button and the overflow item. */
  disabled?: boolean;
  /** Stable React key; falls back to a string label, then the index. */
  key?: React.Key;
}

export interface ButtonsStackProps {
  /** The buttons, in display order. Empty/omitted → renders nothing. */
  buttons: ButtonDefinition[];
  /**
   * Max number of *expanded* buttons. Buttons beyond it collapse into a `⋮` overflow menu (the
   * trigger itself is extra, never counted). Omitted → every button renders expanded, no menu.
   * Accepts a per-breakpoint map (e.g. `{xs: 1, md: 3}`) to reduce the count on narrow viewports.
   */
  maxVisible?: ResponsiveCount;
  /** Which element backs the expanded buttons. Defaults to `button`. */
  surface?: ButtonsStackSurface;
  /** Button variant for the expanded buttons — only used when `surface` is `button`. Defaults to `contained`. */
  variant?: ButtonsStackVariant;
  /**
   * Render the expanded buttons as compact icon-only controls — only used when `surface` is `button`.
   * Accepts a breakpoint (e.g. `'sm'`) to force icon-only only below that width.
   */
  iconOnly?: boolean | Breakpoint;
  /** Size passed to the expanded buttons and the overflow trigger. Defaults to `small`. */
  size?: 'small' | 'medium' | 'large';
  /** Accessible label / tooltip of the `⋮` overflow trigger. Defaults to `More`. */
  moreLabel?: string;
  /** Styles merged onto the root row. */
  sx?: SxProps<Theme>;
}

/** A palette tint for a semantic color; never `inherit` (there is no `inherit.main` palette key). */
const tint = (color: ButtonColor | undefined): SxProps<Theme> | undefined =>
  color && color !== 'inherit' ? {color: `${color}.main`} : undefined;

const keyOf = (button: ButtonDefinition, index: number): React.Key =>
  button.key ?? (typeof button.label === 'string' ? button.label : index);

/**
 * A horizontal row of buttons that collapses the surplus into a `⋮` overflow menu. Driven by an array
 * of {@link ButtonDefinition}s rather than hand-composed buttons. Expanded buttons render as a design
 * `Button` (styled by `variant` + the orthogonal `iconOnly`) or a raw `IconButton`, chosen by the
 * `surface` prop; overflow buttons become tinted menu items. Purely presentational.
 */
export const ButtonsStack = ({
  buttons,
  maxVisible,
  surface = 'button',
  variant = 'contained',
  iconOnly = false,
  size = 'medium',
  moreLabel = 'More',
  sx,
}: ButtonsStackProps) => {
  const {Menu, openMenu, closeMenu} = useMenu();
  // Shares the toolbar overflow logic with `OverflowToolbar`: `maxVisible` is the exact expanded count
  // and the `⋮` trigger is always extra. `minVisible: 0` lets `maxVisible={0}` collapse *every* button
  // into the menu (a pure `⋮` dropdown), which some headers rely on.
  const {
    visibleCount,
    iconOnly: resolvedIconOnly,
    hasOverflow,
  } = useOverflowCount({
    total: buttons.length,
    maxVisible,
    iconOnly,
    minVisible: 0,
  });

  if (!buttons.length) return null;

  const shown = buttons.slice(0, visibleCount);
  const overflow = hasOverflow ? buttons.slice(visibleCount) : [];
  const iconPx = buttonIconPx(size);

  // Renders the bare control for the chosen `surface`. `variant` and `iconOnly` flow straight to the
  // `Button` surface — there is no icon-variant special-casing.
  const renderInner = (
    icon: IconType | string | undefined,
    label: React.ReactNode,
    ariaLabel: string | undefined,
    onClick: (event: React.MouseEvent<HTMLElement>) => void,
    color: ButtonColor,
    disabled: boolean | undefined,
    labelVisible: boolean
  ) => {
    const glyph = icon ? <Icon icon={icon} size={iconPx} /> : null;
    if (surface === 'iconButton') {
      return (
        <IconButton
          size={size}
          color={color}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={onClick}
        >
          {glyph}
        </IconButton>
      );
    }
    return (
      <Button
        variant={variant}
        iconOnly={!labelVisible}
        size={size}
        color={color}
        aria-label={labelVisible ? undefined : ariaLabel}
        disabled={disabled}
        startIcon={labelVisible && icon ? <Icon icon={icon} size={iconPx} /> : undefined}
        onClick={onClick}
      >
        {labelVisible ? label : glyph}
      </Button>
    );
  };

  // Wraps a control: `variant`/`iconOnly` decide the look; a control with no visible text label gets a
  // tooltip so it stays labelled for accessibility.
  const control = (
    icon: IconType | string | undefined,
    label: React.ReactNode,
    onClick: (event: React.MouseEvent<HTMLElement>) => void,
    color: ButtonColor,
    disabled?: boolean
  ) => {
    const ariaLabel = typeof label === 'string' ? label : undefined;
    const labelVisible = surface === 'button' && !resolvedIconOnly;
    const inner = renderInner(icon, label, ariaLabel, onClick, color, disabled, labelVisible);

    if (labelVisible) return inner;
    return (
      <Tooltip title={label} arrow>
        {/*
         * A disabled button can't hold the tooltip's listeners, so wrap it in a span; an enabled
         * button is the tooltip's direct child so it keeps its own single `aria-label` (a span
         * would receive a second, duplicate label from the tooltip).
         */}
        {disabled ? <span style={{display: 'inline-flex'}}>{inner}</span> : inner}
      </Tooltip>
    );
  };

  // The `⋮` overflow trigger is always icon-only and keeps the surface's element, but ignores the
  // stack `variant`: on the `button` surface it is a plain `text` icon button (never `contained` /
  // `outlined`), so it never reads as a primary button.
  const moreGlyph = <Icon icon={IconType.MoreVert} size={iconPx} />;
  const moreTrigger =
    surface === 'iconButton' ? (
      <IconButton size={size} color={'inherit'} aria-label={moreLabel} onClick={openMenu}>
        {moreGlyph}
      </IconButton>
    ) : (
      <Button
        variant={'text'}
        iconOnly
        size={size}
        color={'inherit'}
        aria-label={moreLabel}
        onClick={openMenu}
      >
        {moreGlyph}
      </Button>
    );

  return (
    <Stack direction={'row'} spacing={0.5} alignItems={'center'} sx={sx}>
      {shown.map((button, index) => (
        <React.Fragment key={keyOf(button, index)}>
          {control(
            button.icon,
            button.label,
            button.onClick,
            button.color ?? 'inherit',
            button.disabled
          )}
        </React.Fragment>
      ))}
      {overflow.length > 0 && (
        <>
          <Tooltip title={moreLabel} arrow>
            {moreTrigger}
          </Tooltip>
          <Menu>
            {overflow.map((button, index) => (
              <MenuItem
                key={keyOf(button, index)}
                disabled={button.disabled}
                sx={tint(button.color)}
                onClick={(event) => {
                  button.onClick(event);
                  closeMenu();
                }}
              >
                {button.icon && (
                  <ListItemIcon sx={tint(button.color)}>
                    <Icon icon={button.icon} />
                  </ListItemIcon>
                )}
                <ListItemText>{button.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Stack>
  );
};
