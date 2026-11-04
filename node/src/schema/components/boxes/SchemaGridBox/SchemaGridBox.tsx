import React, {useContext, useMemo} from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {usePanelGridContext} from '@design/contexts/PanelGridContext';
import {PANEL_CONTENT_PADDING_STEPS} from '@design/molecules/PanelContent';
import type {PropertyLabelWidthBreakpoints} from '@design/molecules/PropertyItem';
import {PropertyListContext, type PropertyListContextValue} from '@design/molecules/PropertyList';
import {PanelGrid, PanelGridItem, usePanelGridSpacing} from '@design/organisms/PanelGrid';
import {useTheme} from '@mui/material/styles';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxBody} from '@schema/components/boxes/SchemaBox';
import {SchemaFieldGroup} from '@schema/components/boxes/SchemaBoxChildren';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {DynamicRenderWrapper} from '@schema/components/dynamic/DynamicRenderWrapper';
import {isBoxSchema} from '@schema/utils/api';
import {
  type CellLayout,
  type GridSpans,
  cellPaddingPx,
  computeAutoSpans,
  computeLabelWidth,
  partitionCells,
  pickReference,
  resolveCellSpans,
  shouldAutoComputeSpans,
} from './utils';

type LabelWidthOverrideProps = {
  inherited: PropertyListContextValue;
  labelWidth: PropertyLabelWidthBreakpoints;
  children: React.ReactNode;
};

// Memoizes the merged context value per cell - an inline `{...inherited, labelWidth}` would
// invalidate the context for that cell's whole subtree on every render of `SchemaGridBox`. A cell's
// `useMemo` cannot live in the `.map()` below (rules of hooks), hence the component. Both props have
// to be referentially stable for this to hold; `labelWidths` above is what keeps `labelWidth` so.
const LabelWidthOverride = ({inherited, labelWidth, children}: LabelWidthOverrideProps) => {
  const value = useMemo(() => ({...inherited, labelWidth}), [inherited, labelWidth]);
  return <PropertyListContext.Provider value={value}>{children}</PropertyListContext.Provider>;
};

export const SchemaGridBox = ({
  schema,
  excludeFields,
  isRoot,
  label = schema.label,
}: SchemaBoxProps) => {
  const isLast = useIsLastPanel();
  const parentColumns = usePanelGridContext();
  const theme = useTheme();
  // The gap the grid below renders with.
  const gridSpacing = usePanelGridSpacing();
  // Scaling a cell's label width must not drop what an enclosing `PropertyList` (or a compact
  // `ViewDialog`) already cascades — `orientation`, `lineHeight`, `density` — so the override
  // is layered onto the inherited value rather than replacing it.
  const inheritedPropertyList = useContext(PropertyListContext);

  // Memoized: kept referentially stable across a re-render that doesn't actually change
  // `schema.boxes` / `excludeFields`, so a memoized `SchemaFieldGroup` cell below can see the same
  // `fields` array and bail out too — otherwise every render would rebuild it from scratch and
  // defeat that memo.
  const {items, cells} = useMemo(() => {
    const items = (schema.boxes || []).filter(
      (item) => isBoxSchema(item) || !excludeFields?.includes(item.name)
    );
    return {items, cells: partitionCells(items)};
  }, [schema.boxes, excludeFields]);
  const autoComputeGridItems = shouldAutoComputeSpans(items);
  const {xs, sm, md, lg, xl} = computeAutoSpans(
    parentColumns,
    cells.length || 1,
    autoComputeGridItems
  );

  const hasToolbarActions = !!schema.toolbarActions?.length;
  const hasBottomActions = !!schema.bottomActions?.length;

  // A bare grid (no label / collapsible / toolbar actions) carries no card chrome or header — it is
  // a pure layout container. As the view's root box it keeps the card default only while it holds
  // fields of its own (they need the surface); otherwise the default is handed to its cells. A grid
  // holds growing box children, so it fills its height on the last path.
  const hasFieldCells = cells.some((cell) => cell.kind === 'fields');
  const card = useBoxCard(
    schema,
    Boolean(label || schema.collapsible || hasToolbarActions),
    isRoot && hasFieldCells
  );
  // A grid that draws a card is itself the surface, so its cells are no longer a root.
  const cellIsRoot = isRoot && !card;
  const fill = isLast;

  // Both feed the `pxCorrection` math in `computeLabelWidth` — read from the theme (rather than
  // hardcoded) so they stay correct if the theme's base spacing unit is ever customized.
  const mediumPaddingPx = 2 * parseFloat(String(theme.spacing(PANEL_CONTENT_PADDING_STEPS.medium)));
  const gapPx = parseFloat(String(theme.spacing(gridSpacing)));

  // One memo for the whole chain, because `computeLabelWidth` returns a fresh object per call:
  // deriving it in the render body hands `LabelWidthOverride` a new `labelWidth` every render and
  // defeats its memo. Indexed by cell.
  const labelWidths = useMemo(() => {
    const autoSpans: GridSpans = {xs, sm, md, lg, xl};
    const layouts: CellLayout[] = cells.map((cell) => ({
      span: resolveCellSpans(autoSpans, cell.kind === 'box' ? cell.box.gridItem : undefined),
      paddingPx: cellPaddingPx(cell.kind === 'box' ? cell.box : undefined, mediumPaddingPx),
    }));
    if (!layouts.length) return [];
    const reference = pickReference(layouts);
    return layouts.map((own) => computeLabelWidth(reference, own, parentColumns, gapPx));
  }, [cells, xs, sm, md, lg, xl, mediumPaddingPx, parentColumns, gapPx]);

  const content = (
    <PanelGrid sx={fill ? {flexGrow: 1, minHeight: 0} : undefined}>
      {cells.map((cell, index) => {
        const overrideLabelWidth = labelWidths[index];
        const wrap = (el: React.ReactNode) =>
          overrideLabelWidth ? (
            <LabelWidthOverride inherited={inheritedPropertyList} labelWidth={overrideLabelWidth}>
              {el}
            </LabelWidthOverride>
          ) : (
            el
          );

        if (cell.kind === 'fields') {
          return (
            <PanelGridItem key={index} xs={xs} sm={sm} md={md} lg={lg} xl={xl}>
              {wrap(<SchemaFieldGroup fields={cell.fields} />)}
            </PanelGridItem>
          );
        }
        const gridItem = cell.box.gridItem;
        return (
          // The cell owns the box's slot: hiding it here drops the grid item too, instead of
          // leaving an empty cell behind, so the box inside renders without a check of its own.
          <DynamicRenderWrapper showQuery={cell.box.options?.dynamicRender?.showQuery} key={index}>
            <PanelGridItem
              xs={gridItem?.xs || xs}
              sm={gridItem?.sm || sm}
              md={gridItem?.md || md}
              lg={gridItem?.lg || lg}
              xl={gridItem?.xl || xl}
            >
              {wrap(
                <SchemaBoxBody
                  schema={cell.box}
                  excludeFields={excludeFields}
                  isRoot={cellIsRoot}
                />
              )}
            </PanelGridItem>
          </DynamicRenderWrapper>
        );
      })}
    </PanelGrid>
  );

  return (
    <BoxLayout
      schema={schema}
      card={card}
      label={label ? <DynamicText>{label}</DynamicText> : undefined}
      paddingSize={card ? 'medium' : 'none'}
      action={
        hasToolbarActions ? (
          <SchemaButtons size="small" variant="contained" descriptors={schema.toolbarActions} />
        ) : undefined
      }
      footerRight={
        hasBottomActions ? (
          <SchemaButtons size="medium" variant="contained" descriptors={schema.bottomActions} />
        ) : undefined
      }
      fullHeight={fill}
    >
      {content}
    </BoxLayout>
  );
};
