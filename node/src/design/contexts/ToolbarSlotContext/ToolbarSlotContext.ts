import {createContext} from 'react';

export interface ToolbarSlotContextValue {
  /** This slot sits inside the `⋮` overflow menu, so its control should render as a `menuItem`. */
  inMenu: boolean;
  /** Force inline controls to icon-only (label hidden) — set below the toolbar's responsive breakpoint. */
  iconOnly: boolean;
}

/** Undefined outside a toolbar → consumers fall back to the neutral `{inMenu:false, iconOnly:false}`. */
export const ToolbarSlotContext = createContext<ToolbarSlotContextValue | undefined>(undefined);
