import React, {useMemo} from 'react';
import {varAlpha} from '@design/theme/utils';
import {Box} from '@mui/material';
import type {SxProps, Theme} from '@mui/material';
import {SimpleTreeView, TreeItem} from '@mui/x-tree-view';
import {Icon, IconType} from '../../atoms/Icon';
import {TreeNode, TreeSelectProps} from './types';
import {allNodeIds, ancestorIds, buildTree} from './utils';

// Styles the tree to read like a `MenuList`: compact 4px-padded, `body2`, rounded rows with a 4px
// gap, and a hover/selected tint that matches the `DataGrid` rows (primary, 8/15% light · 20/30%
// dark). Rewrites the x-tree-view defaults, whose selection state is expressed via `data-*` attrs
// (`data-selected` / `data-focused`) rather than `Mui-selected` classes.
//
// `selectable` gates the hover/focus tint: when the tree can't be picked in (a read-only value
// display, e.g. `TreeArrayField`), only the selected rows tint — a hover highlight would suggest an
// interaction that isn't there.
const treeSx =
  (selectable: boolean): SxProps<Theme> =>
  (theme) => {
    const isDark = theme.palette.mode === 'dark';
    const c = theme.palette.primary.mainChannel;
    const hoverBg = varAlpha(c, isDark ? 0.2 : 0.08);
    const selectedBg = varAlpha(c, isDark ? 0.3 : 0.15);
    return {
      p: 0.5,
      '& .MuiTreeItem-content': {
        borderRadius: `${theme.radius.md}px`,
        transition: theme.transitions.create('background-color'),
        // 4px padding all round, keeping the depth indentation the default bakes into paddingLeft.
        py: 0.5,
        pr: 0.5,
        pl: `calc(${theme.spacing(0.5)} + var(--TreeView-itemChildrenIndentation) * var(--TreeView-itemDepth))`,
        // 4px gap between consecutive rows; reset on the first so the list padding stays even.
        mt: 0.5,
        // When not selectable (a read-only display) the hover/focus tint is zeroed rather than
        // omitted — otherwise x-tree-view's own `action.hover` / `action.focus` defaults show through.
        '&:hover, &[data-focused]': {backgroundColor: selectable ? hoverBg : 'transparent'},
        '&[data-selected], &[data-selected]:hover, &[data-selected][data-focused]': {
          backgroundColor: selectedBg,
        },
      },
      '& > .MuiTreeItem-root:first-of-type > .MuiTreeItem-content': {mt: 0},
      '& .MuiTreeItem-label': theme.typography.body2,
    };
  };

/**
 * Presentational hierarchical multi-select. Rebuilds a tree from flat `choices` and renders it as a
 * collapsible `SimpleTreeView`. Fully controlled selection via `selectedIds` / `onSelectionChange`;
 * omitting `onSelectionChange` makes it read-only (a value display). No React Admin, no schema — all
 * tree logic (build + expansion) lives here, so both the admin input and field just bind data.
 */
export const TreeSelect = ({
  choices,
  selectedIds,
  onSelectionChange,
  disabled = false,
  expand = 'all',
}: TreeSelectProps) => {
  const selectable = !!onSelectionChange && !disabled;

  // Defensive: bindings may pass a non-array (e.g. React Admin seeds an unset field with `''`).
  const ids = useMemo(() => (Array.isArray(selectedIds) ? selectedIds : []), [selectedIds]);

  const {roots, byId} = useMemo(() => buildTree(choices), [choices]);
  const expandedItems = useMemo(
    () => (expand === 'all' ? allNodeIds(byId) : ancestorIds(byId, ids)),
    [expand, byId, ids]
  );
  const selectedItems = useMemo(() => ids.map(String), [ids]);

  const renderNode = (node: TreeNode): React.ReactNode => (
    <TreeItem key={node.choice.id} itemId={String(node.choice.id)} label={node.choice.name}>
      {node.children.map(renderNode)}
    </TreeItem>
  );

  return (
    <Box sx={{opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : undefined}}>
      <SimpleTreeView
        sx={treeSx(selectable)}
        // `expand: 'all'` keeps every node open (controlled). `expand: 'selected'` seeds the open
        // ancestors but leaves the user free to collapse/expand (uncontrolled default).
        {...(expand === 'all' ? {expandedItems} : {defaultExpandedItems: expandedItems})}
        selectedItems={selectedItems}
        onSelectedItemsChange={
          selectable ? (_event, itemIds) => onSelectionChange?.(itemIds) : undefined
        }
        multiSelect
        disableSelection={!selectable}
        disabledItemsFocusable
        slots={{
          collapseIcon: () => <Icon icon={IconType.ExpandMore} />,
          expandIcon: () => <Icon icon={IconType.ChevronRight} />,
        }}
      >
        {roots.map(renderNode)}
      </SimpleTreeView>
    </Box>
  );
};
