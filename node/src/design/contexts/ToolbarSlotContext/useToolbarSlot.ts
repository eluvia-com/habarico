import {useContext} from 'react';
import {ToolbarSlotContext, ToolbarSlotContextValue} from './ToolbarSlotContext';

const NEUTRAL: ToolbarSlotContextValue = {inMenu: false, iconOnly: false};

/**
 * The toolbar-slot hint for a button control. An `OverflowToolbar` provides it per slot: an overflowed
 * slot reports `inMenu: true` (render as a `menuItem`); an inline slot reports the resolved `iconOnly`.
 * Safe outside any toolbar — returns the neutral value, so a standalone button is unaffected. Reading it
 * (rather than threading props) is what lets the collapse work for *any* control, not just schema buttons.
 */
export const useToolbarSlot = (): ToolbarSlotContextValue =>
  useContext(ToolbarSlotContext) ?? NEUTRAL;
