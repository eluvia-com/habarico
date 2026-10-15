// Design-local view-model for the tree selector — deliberately React-Admin-free (no `Identifier`
// import) so the design layer stays free of RA. The consumer (admin `useTreeChoices`) maps its
// records into these plain choices; the presentation logic lives entirely in `TreeSelect`.

/** Node identifier. Plain `string | number` — not react-admin's `Identifier`, to keep design RA-free. */
export type TreeItemId = string | number;

export type TreeChoice = {
  id: TreeItemId;
  /** Displayed label — the caller computes the record representation. */
  name: string;
  /** Id of the parent choice; roots omit it. */
  parentId?: TreeItemId;
};

/** A materialized tree node — a `TreeChoice` with its resolved children. Built by `buildTree`. */
export type TreeNode = {
  choice: TreeChoice;
  children: TreeNode[];
};

export type TreeSelectProps = {
  /** Flat list of choices; the hierarchy is reconstructed from `parentId`. */
  choices: TreeChoice[];
  /** Currently selected node ids. */
  selectedIds: TreeItemId[];
  /** Selection callback. Omit to render read-only (no selection changes). */
  onSelectionChange?: (ids: TreeItemId[]) => void;
  /** Greys out and blocks interaction with the whole tree. */
  disabled?: boolean;
  /**
   * Which nodes start expanded:
   * - `'all'` (default) — every node, so the whole hierarchy is visible while picking.
   * - `'selected'` — only the ancestors of the selected nodes, to reveal the current value.
   */
  expand?: 'all' | 'selected';
};
