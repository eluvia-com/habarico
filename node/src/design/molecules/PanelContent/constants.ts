import type {PanelContentPadding} from './PanelContent';

// Maps each padding step to a spacing multiple (× 8px): none → 0, small → 8px, medium → 16px.
// Exported so layout math that needs to know a panel's actual padding ahead of rendering (e.g.
// `SchemaGridBox`'s label-width alignment) can reuse the same source of truth.
export const PANEL_CONTENT_PADDING_STEPS: Record<PanelContentPadding, number> = {
  none: 0,
  small: 1,
  medium: 2,
};
