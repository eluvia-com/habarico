import React from 'react';
import {DatagridRowTooltip, DatagridTooltipFn} from '@admin/components/datagrid/DatagridRowTooltip';
import {ActionDescriptor, HabRecord} from '@schema/types';
import {resolveRowActionSchema} from './resolveRowActionSchema';

export const createRowTooltip = (
  singleSlotActive: boolean,
  doubleSlotActive: boolean,
  singleClickAction?: ActionDescriptor,
  doubleClickAction?: ActionDescriptor
): DatagridTooltipFn | undefined => {
  if (!singleSlotActive && !doubleSlotActive) return undefined;
  const rowTooltip: DatagridTooltipFn = (record) => {
    const actions = (record as HabRecord).meta?.schema?.actions;
    const singleLabel = singleSlotActive
      ? resolveRowActionSchema(actions, singleClickAction)?.label
      : undefined;
    const doubleLabel = doubleSlotActive
      ? resolveRowActionSchema(actions, doubleClickAction)?.label
      : undefined;
    if (!singleLabel && !doubleLabel) return null;
    return <DatagridRowTooltip singleLabel={singleLabel} doubleLabel={doubleLabel} />;
  };
  return rowTooltip;
};
