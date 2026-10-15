import React, {useMemo} from 'react';
import {PanelGrid, type PanelGridProps} from '@design/organisms/PanelGrid';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import {BoxItem, BoxSchema, FieldDescriptor} from '@schema/types';
import {isBoxSchema} from '@schema/utils/api';
import {SchemaFieldGroup} from './SchemaFieldGroup';

// A box's children partitioned into layout cells: a maximal run of consecutive field descriptors
// collapses into one PropertyList cell; each nested box is its own cell.
type BoxChildCell = {kind: 'fields'; fields: FieldDescriptor[]} | {kind: 'box'; box: BoxSchema};

export type SchemaBoxChildrenProps = {
  /** The box's children (nested boxes and/or field descriptors). */
  boxes: BoxItem[];
  /** Field names to hide (e.g. a reference box hides the column it is nested under). */
  excludeFields?: string[];
  /** Grid columns for the pure-boxes / mixed case. Defaults to a single column. */
  maxColumns?: PanelGridProps['maxColumns'];
  /** `PropertyList` value columns for a run of fields. Defaults to 1. */
  columns?: number;
  /**
   * Grow the boxes grid to fill the box height — pass when the enclosing box is `fullHeight` and
   * holds a growing child, so a nested box/list reaches the bottom. No effect on a pure-field box
   * (fields keep their natural height).
   */
  fill?: boolean;
  /**
   * Hands the root-box card default to the nested boxes — passed by a layout box that holds no
   * fields of its own, so the card lands on the first child that does.
   */
  isRoot?: boolean;
};

/**
 * Renders a box's children by splitting fields from nested boxes: consecutive fields become a
 * single `PropertyList` (via `SchemaFieldGroup`), each nested box renders through `SchemaBox`
 * (its own Panel/Section). A pure-field box renders the list directly; a pure-box or mixed box
 * lays its cells out in a `PanelGrid`.
 */
const SchemaBoxChildrenComponent = ({
  boxes,
  excludeFields,
  maxColumns = 1,
  columns = 1,
  fill = false,
  isRoot = false,
}: SchemaBoxChildrenProps) => {
  // Memoized: kept referentially stable across a re-render that doesn't actually change `boxes` /
  // `excludeFields` (e.g. this component's own parent re-rendering for an unrelated reason), so a
  // memoized `SchemaFieldGroup` below can actually see the same `fields` array and bail out too —
  // otherwise every render would rebuild these arrays from scratch and defeat that memo.
  const cells: BoxChildCell[] = useMemo(() => {
    const items = boxes.filter((item) => isBoxSchema(item) || !excludeFields?.includes(item.name));
    const result: BoxChildCell[] = [];
    for (const item of items) {
      if (isBoxSchema(item)) {
        result.push({kind: 'box', box: item});
        continue;
      }
      const last = result[result.length - 1];
      if (last?.kind === 'fields') {
        last.fields.push(item);
      } else {
        result.push({kind: 'fields', fields: [item]});
      }
    }
    return result;
  }, [boxes, excludeFields]);

  if (cells.length === 0) return null;

  // Pure-fields box: render the single PropertyList directly, with no grid wrapper.
  if (cells.length === 1 && cells[0].kind === 'fields') {
    return <SchemaFieldGroup fields={cells[0].fields} columns={columns} />;
  }

  // Pure-boxes or mixed: each cell (a field run's PropertyList or a nested box) is a grid item.
  // With more than one cell, `alignContent: flex-start` packs them at the top: when the box fills a
  // height taller than its content (an equal-height sibling stretched it, e.g. a card with a collapsed
  // sub-panel), the surplus sits at the bottom instead of stretching the rows and spreading the fields
  // apart. A single cell is left to stretch so it fills the box (a wrapped box / list must keep filling
  // its equal-height card).
  const packTop = cells.length > 1;
  return (
    <PanelGrid
      maxColumns={maxColumns}
      sx={{
        ...(packTop ? {alignContent: 'flex-start'} : {}),
        ...(fill ? {flexGrow: 1, minHeight: 0} : {}),
      }}
    >
      {cells.map((cell, index) =>
        cell.kind === 'fields' ? (
          <SchemaFieldGroup key={index} fields={cell.fields} columns={columns} />
        ) : (
          <SchemaBox key={index} schema={cell.box} excludeFields={excludeFields} isRoot={isRoot} />
        )
      )}
    </PanelGrid>
  );
};

// Memoized: a box that owns this slot (`SchemaSimpleBox`, the object boxes) re-renders whenever it
// reads `isHidden` off `ParentBoxContext` to forward it to its own children — on every tab switch,
// for the panel entering/leaving — even though `boxes`/`excludeFields`/`fill`/`isRoot` never change
// because of that. Without this, every field/nested box the box holds pays for that re-render too.
export const SchemaBoxChildren = React.memo(SchemaBoxChildrenComponent);
