import React, {useEffect} from 'react';
import {Breakpoint, IconButton, Stack, SxProps, Theme, Tooltip} from '@mui/material';
import {Button} from '../../atoms/Button';
import {Icon, IconType, buttonIconPx} from '../../atoms/Icon';
import {ToolbarSlotProvider} from '../../contexts/ToolbarSlotContext';
import {useMenu} from '../../hooks/useMenu';
import {ResponsiveCount, useOverflowCount} from '../../hooks/useOverflowCount';

/**
 * The `⋮` overflow trigger. Its own control — separate from the toolbar's children — so it carries its
 * own presentation: mirror the children's `surface` / `size` so it blends in. (These only ever styled
 * the trigger, never the children, so they live here rather than on the toolbar root.)
 */
export interface MoreSlot {
  /** Element backing the trigger — mirror the controls' own surface. Defaults to `button`. */
  surface?: 'button' | 'iconButton';
  /** Trigger size; should match the controls. Defaults to `medium`. */
  size?: 'small' | 'medium' | 'large';
  /** Accessible label / tooltip of the trigger. Defaults to `More`. */
  label?: string;
}

export interface OverflowToolbarProps {
  /** The button controls, in priority order. The surplus collapses, tail-first, into the `⋮` menu. */
  children: React.ReactNode;
  /**
   * Max inline controls before the surplus collapses into the `⋮` menu — the trigger is **always
   * extra**, never counted. Fixed number or per-breakpoint map (e.g. `{xs: 1, md: 3}`). Omitted → all inline.
   */
  maxVisible?: ResponsiveCount;
  /** Force inline controls to icon-only below a breakpoint (e.g. `'sm'`) or always (`true`). */
  iconOnly?: boolean | Breakpoint;
  /** Fewest inline controls kept when overflowing. Defaults to `1`; pass `0` to allow an all-in-menu row. */
  minVisible?: number;
  /** Presentation of the `⋮` overflow trigger (surface / size / label). */
  more?: MoreSlot;
  /** Styles merged onto the root row. */
  sx?: SxProps<Theme>;
}

/**
 * A horizontal row of button controls that collapses its surplus into a `⋮` overflow menu, driven by
 * *directly rendered* children (not a button-object array — that is `ButtonsStack`). It never inspects
 * or clones the children: {@link useOverflowCount} decides how many stay inline, and a
 * `ToolbarSlotProvider` tells each slot, via context, whether it sits in the menu (→ render as a
 * `menuItem`) and whether inline controls are icon-only. Any control that reads `useToolbarSlot` (the
 * admin `ActionButton`, and hence every schema button) participates — which is what makes the collapse
 * reusable beyond `SchemaButtons`, for page and box toolbars alike.
 */
export const OverflowToolbar = ({
  children,
  maxVisible,
  iconOnly,
  minVisible,
  more,
  sx,
}: OverflowToolbarProps) => {
  const {surface = 'button', size = 'medium', label = 'More'} = more ?? {};
  const {Menu, openMenu, closeMenu, open} = useMenu();
  const items = React.Children.toArray(children).filter(Boolean);
  const {
    visibleCount,
    iconOnly: forceIconOnly,
    hasOverflow,
  } = useOverflowCount({
    total: items.length,
    maxVisible,
    iconOnly,
    minVisible,
  });

  // The `⋮` trigger + `Menu` unmount when a wider viewport removes the overflow, but `useMenu` keeps its
  // open state and (now-detached) anchor. Without this, shrinking back re-opens the menu anchored to a
  // stale element, which jumps to the top-left corner. Closing it as soon as the overflow is gone keeps
  // the menu tied to a live trigger.
  useEffect(() => {
    if (!hasOverflow && open) closeMenu();
  }, [hasOverflow, open, closeMenu]);

  if (!items.length) return null;

  const inline = items.slice(0, visibleCount);
  const overflow = hasOverflow ? items.slice(visibleCount) : [];
  const iconPx = buttonIconPx(size);
  const moreGlyph = <Icon icon={IconType.MoreVert} size={iconPx} />;

  // The trigger is always icon-only and never reads as a primary button (plain `text` on the button
  // surface), matching `ButtonsStack`. It ignores the toolbar context, so it stays a real button even
  // though it is wrapped in the `inMenu` provider below (which only affects context-aware children).
  const trigger =
    surface === 'iconButton' ? (
      <IconButton size={size} color={'inherit'} aria-label={label} onClick={openMenu}>
        {moreGlyph}
      </IconButton>
    ) : (
      <Button
        variant={'text'}
        iconOnly
        size={size}
        color={'inherit'}
        aria-label={label}
        onClick={openMenu}
      >
        {moreGlyph}
      </Button>
    );

  return (
    <Stack direction={'row'} spacing={0.5} alignItems={'center'} sx={sx}>
      <ToolbarSlotProvider inMenu={false} iconOnly={forceIconOnly}>
        {inline}
      </ToolbarSlotProvider>
      {overflow.length > 0 && (
        // The provider wraps the `Menu` (not its children) so the overflow items stay `Menu`'s *direct*
        // children — MUI's keyboard/focus handling needs that — while still reading `inMenu` via context.
        <ToolbarSlotProvider inMenu={true} iconOnly={false}>
          <Tooltip title={label} arrow>
            {trigger}
          </Tooltip>
          <Menu
            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            transformOrigin={{vertical: 'top', horizontal: 'left'}}
          >
            {overflow}
          </Menu>
        </ToolbarSlotProvider>
      )}
    </Stack>
  );
};
