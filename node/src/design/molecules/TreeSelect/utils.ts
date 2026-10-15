import {TreeChoice, TreeItemId, TreeNode} from './types';

/**
 * Rebuilds the parent→children hierarchy from a flat `choices` list (keyed on `parentId`). Returns
 * the root nodes and a by-id lookup. Node keys are stringified ids (React tree views key on strings).
 * A choice whose `parentId` has no matching entry is treated as a root (defensive against dangling refs).
 */
export const buildTree = (choices: TreeChoice[]) => {
  const byId: Record<string, TreeNode> = {};
  const roots: TreeNode[] = [];

  choices.forEach((choice) => {
    byId[String(choice.id)] = {choice, children: []};
  });

  choices.forEach((choice) => {
    const node = byId[String(choice.id)];
    const parentKey = choice.parentId != null ? String(choice.parentId) : undefined;
    if (parentKey && byId[parentKey]) {
      byId[parentKey].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return {roots, byId};
};

/** Ids of every node (stringified) — the `expand: 'all'` set. */
export const allNodeIds = (byId: Record<string, TreeNode>): string[] => Object.keys(byId);

/**
 * Ancestor ids (stringified) of the selected nodes — the `expand: 'selected'` set. Walks each
 * selected node's `parentId` chain upward, so the tree opens just enough to reveal the current value.
 */
export const ancestorIds = (
  byId: Record<string, TreeNode>,
  selectedIds: TreeItemId[]
): string[] => {
  const expanded = new Set<string>();
  selectedIds.forEach((id) => {
    let current = byId[String(id)];
    while (current?.choice.parentId != null) {
      const parentKey = String(current.choice.parentId);
      if (expanded.has(parentKey)) break;
      expanded.add(parentKey);
      current = byId[parentKey];
    }
  });
  return Array.from(expanded);
};
