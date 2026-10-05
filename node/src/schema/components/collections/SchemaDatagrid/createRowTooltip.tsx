import React from 'react';
import {DatagridRowTooltip, DatagridTooltipFn} from '@admin/components/datagrid/DatagridRowTooltip';
import {ActionDescriptor, HabRecord} from '@schema/types';
import {ReferencedSchemasLookup} from '@schema/utils/actionDescriptor';
import {resolveRowAction} from './resolveRowAction';

export const createRowTooltip = (
  singleSlotActive: boolean,
  doubleSlotActive: boolean,
  singleClickAction?: ActionDescriptor,
  doubleClickAction?: ActionDescriptor,
  schemas?: ReferencedSchemasLookup
): DatagridTooltipFn | undefined => {
  if (!singleSlotActive && !doubleSlotActive) return undefined;
  const rowTooltip: DatagridTooltipFn = (record) => {
    const actions = (record as HabRecord).meta?.schema?.actions;
    const singleLabel = singleSlotActive
      ? resolveRowAction(actions, singleClickAction, {schemas})?.schema.label
      : undefined;
    const doubleLabel = doubleSlotActive
      ? resolveRowAction(actions, doubleClickAction, {schemas})?.schema.label
      : undefined;
    if (!singleLabel && !doubleLabel) return null;
    return <DatagridRowTooltip singleLabel={singleLabel} doubleLabel={doubleLabel} />;
  };
  return rowTooltip;
};
