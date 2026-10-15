/**
 * Glyph px sizes matched to a button `size`. Used by `ActionButton` and `ButtonsStack` when they
 * render an icon, so the glyph scales with the button rather than being fixed. Deliberately owned by
 * the button components (not forced inside the `Button` / `IconButton` primitives).
 */
export const BUTTON_ICON_PX = {small: 18, medium: 20, large: 22} as const;

export type ButtonIconSize = keyof typeof BUTTON_ICON_PX;

/** Resolve the glyph px for a button `size` (an absent size behaves like `medium`). */
export const buttonIconPx = (size: ButtonIconSize | undefined): number =>
  BUTTON_ICON_PX[size ?? 'medium'];
