import React from 'react';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {FormDynamicRenderWrapper} from './FormDynamicRenderWrapper';
import {ShowDynamicRenderWrapper} from './ShowDynamicRenderWrapper';
import {DynamicRenderProps} from './types';

/**
 * Renders `children` only while `showQuery` holds, `hiddenEl` (or nothing) otherwise. Wrap it around
 * whatever owns the slot the field/box takes up — a `PropertyItem` row, a grid cell, a datagrid cell —
 * so hiding removes the slot as a whole, label included. The public leaves (`SchemaInput`,
 * `SchemaField`, `SchemaBox`) wrap themselves for standalone use; a component that owns the slot
 * renders their `*Body` instead, so a query is evaluated exactly once.
 */
export const DynamicRenderWrapper = ({showQuery, children, hiddenEl}: DynamicRenderProps) => {
  const {readOnly} = useViewSchemaContext();

  if (!showQuery) {
    return children;
  }

  const Wrapper = readOnly ? ShowDynamicRenderWrapper : FormDynamicRenderWrapper;
  return (
    <Wrapper showQuery={showQuery} hiddenEl={hiddenEl}>
      {children}
    </Wrapper>
  );
};

// Marks this wrapper as a transparent pass-through for `PanelGrid`: when a `PanelGrid` child is a
// `DynamicRenderWrapper` around a `PanelGridItem`, the grid must treat it as an already-wrapped item
// (and not re-wrap it with auto-computed spans, which would discard the item's own column widths).
// The flag name must match the one `PanelGrid.isPreWrapped` reads (`__panelGridPassthrough`) — it was
// left as the pre-rename `__gridBoxPassthrough` when `GridBox` became the design-layer `PanelGrid`.
DynamicRenderWrapper.__panelGridPassthrough = true;
