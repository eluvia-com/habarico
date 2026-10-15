import {get} from 'lodash-es';
import React from 'react';
import {useRecordContext} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {TreeChoice, TreeItemId, TreeSelect} from '@design/molecules/TreeSelect';

export type TreeArrayFieldProps = FieldProps & {
  choices: TreeChoice[];
};

/**
 * Read-only display for hierarchical `tree-relation` references — a thin binding over the design
 * `TreeSelect`. It reads the selected node ids straight from the ambient record (`record[source]`)
 * and renders the tree read-only (no `onSelectionChange`), opening just the ancestors of the selected
 * nodes (`expand="selected"`). The `choices` are supplied by the caller — the schema layer resolves
 * them via `useTreeChoices` — so the field itself does no fetching and stays schema-agnostic.
 */
export const TreeArrayField = ({source, choices}: TreeArrayFieldProps) => {
  const record = useRecordContext();
  const raw = record ? get(record, source) : undefined;
  const selectedIds = Array.isArray(raw) ? (raw as TreeItemId[]) : [];

  return <TreeSelect choices={choices} selectedIds={selectedIds} expand="selected" />;
};
