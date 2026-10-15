import {type PanelContentPadding} from '@design/molecules/PanelContent';
import {BoxSchema, BoxType} from '@schema/types';

// Box types whose content is a full-bleed collection (datagrid / list / gallery): they render
// edge-to-edge with no body gutter, clipped to the panel's rounded corners. Everything else
// (object / simple / grid / tab / wizard) keeps the standard medium gutter. Exported so other
// layout math that needs to know a box's padding ahead of rendering (e.g. `SchemaGridBox`'s
// label-width alignment) can reuse the same source of truth instead of duplicating the list.
export const FULL_BLEED_TYPES: BoxType[] = ['list', 'array', 'gallery'];

export type ResolvedBoxLayout = {
  /** Whether the box body can be collapsed (schema `collapsible` set to either state). */
  collapsible: boolean;
  /** Initial collapsed state — `true` only when `collapsible: 'closed'`. */
  defaultCollapsed: boolean;
  /** Content padding derived from the box type (full-bleed → none, otherwise medium). */
  paddingSize: PanelContentPadding;
  /** Whether the body is full-bleed (edge-to-edge, clipped) — datagrid / list / gallery boxes. */
  flush: boolean;
};

/**
 * Resolves the schema-derived layout flags for a box: its collapsible behaviour and the
 * content padding / full-bleed defaults inferred from `schema.type`. Kept separate from
 * {@link BoxLayout} so a box can read the resolved flags directly when it needs them (e.g. to
 * decide whether to fill height). Pure derivation from the schema — safe to call anywhere.
 */
export const useBoxLayout = (schema: BoxSchema): ResolvedBoxLayout => {
  const fullBleed = FULL_BLEED_TYPES.includes(schema.type);
  return {
    collapsible: schema.collapsible !== undefined,
    defaultCollapsed: schema.collapsible === 'closed',
    paddingSize: fullBleed ? 'none' : 'medium',
    flush: fullBleed,
  };
};
