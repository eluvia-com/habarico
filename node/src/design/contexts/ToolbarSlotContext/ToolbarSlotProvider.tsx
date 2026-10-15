import React, {ReactNode, useMemo} from 'react';
import {ToolbarSlotContext} from './ToolbarSlotContext';

interface ToolbarSlotProviderProps {
  /** Whether the wrapped slot(s) render inside the `⋮` overflow menu. */
  inMenu: boolean;
  /** Whether inline controls in the wrapped slot(s) drop their labels. */
  iconOnly: boolean;
  children: ReactNode;
}

/**
 * Broadcasts the per-slot toolbar hint that {@link useToolbarSlot} reads. An `OverflowToolbar` wraps
 * its inline row in one provider (`inMenu:false`, the resolved `iconOnly`) and its overflow menu in
 * another (`inMenu:true`), so it never has to inspect or clone the children themselves.
 */
export const ToolbarSlotProvider = ({inMenu, iconOnly, children}: ToolbarSlotProviderProps) => {
  const value = useMemo(() => ({inMenu, iconOnly}), [inMenu, iconOnly]);
  return <ToolbarSlotContext.Provider value={value}>{children}</ToolbarSlotContext.Provider>;
};
