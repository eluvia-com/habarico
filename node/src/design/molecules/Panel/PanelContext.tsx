import {createContext, useContext} from 'react';

/** Surface style of a {@link Panel} — see the `Panel` `variant` prop. */
export type PanelVariant = 'root' | 'nested';

/**
 * Presentation-only state shared by a `Panel` with its slot children
 * (`PanelHeader` renders the collapse toggle; `PanelContent` collapses). It carries
 * no data — only the panel's visual variant and its collapse state — so the compound
 * stays schema-agnostic.
 */
export type PanelContextValue = {
  /** The owning panel's surface variant. */
  variant: PanelVariant;
  /** Whether the panel exposes a collapse toggle at all. */
  collapsible: boolean;
  /** Current collapsed state (only meaningful when `collapsible`). */
  collapsed: boolean;
  /** Flip the collapsed state. */
  toggle: () => void;
  /**
   * When `true`, the panel is visually emphasized — a `primary.main` inset outline on the
   * surface and an `action.hover` tint on the header. Set once on `Panel`; the header reads
   * it from here so the styling stays in sync without threading the prop through each slot.
   */
  emphasized: boolean;
};

export const PanelContext = createContext<PanelContextValue | null>(null);

/**
 * Read the surrounding `Panel`'s shared state. Throws when used outside a `Panel`
 * so a misplaced `PanelHeader`/`PanelContent` fails loudly instead of silently
 * losing its collapse behaviour.
 */
export const usePanelContext = (): PanelContextValue => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('Panel compound components must be rendered inside a <Panel>.');
  }
  return context;
};
