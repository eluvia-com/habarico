import {IconType} from './enums';

/**
 * Presentational tweaks applied to a curated {@link IconType} by the icon primitive itself, so no
 * consumer ever rotates or re-bases an `Icon` by hand.
 */
export type IconModifier = {
  /**
   * Underlying icon-set glyph to render instead of the {@link IconType}'s own name. Lets a curated
   * icon be *derived* from another glyph (e.g. a rotated variant that the set doesn't ship).
   */
  baseIcon?: IconType | string;
  /** Clockwise rotation of the glyph, in degrees. */
  rotate?: number;
};

/**
 * Modifiers for the (few) curated icons that are derived from another glyph. `HorizontalAlignCenter`
 * has no Material glyph of its own — it is `VerticalAlignCenter` turned 90°. Keeping the transform
 * here means the {@link IconType} is self-contained: consumers just pick the semantic icon and the
 * primitive owns the rotation.
 */
export const ICON_MODIFIERS: Partial<Record<IconType, IconModifier>> = {
  [IconType.HorizontalAlignCenter]: {baseIcon: 'VerticalAlignCenter', rotate: 90},
};
