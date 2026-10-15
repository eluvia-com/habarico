import {useInsidePanel} from '@design/contexts/InsidePanelContext';
import {BoxSchema} from '@schema/types';

/**
 * Resolves whether a box renders card chrome. `schema.card` is three-state: `true` always renders
 * the card, `false` never does — not even for a labelled box, whose heading then renders in the
 * card-less `Section` header — and `null` / absent (the two are the same value here) leaves the
 * decision to this hook.
 *
 * Without an explicit value the box takes a card when one of its own signals asks for it
 * (`implicit` — a label, header actions, a collapsible body; which of them apply differs per box
 * type), or when it is the view's root box on a page: page content starts outside any card, so the
 * first box holding content is what puts it on a surface. Pass `isRoot` only where the box keeps
 * that default: a box that only wraps other boxes is pure layout (a grid, a tab step, a bare
 * `simple` wrapper) and hands the default down to them instead — see `hasFieldDescriptors`. Inside a dialog / side panel that surface is the
 * overlay's own `Paper` (`InsidePanelContext`), so the root box stays card-less and no card sits
 * inside a card.
 */
export const useBoxCard = (schema: BoxSchema, implicit: boolean, isRoot = false): boolean => {
  const insidePanel = useInsidePanel();
  return schema.card ?? (implicit || (isRoot && !insidePanel));
};
