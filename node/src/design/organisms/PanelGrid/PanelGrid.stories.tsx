import React from 'react';
import {Box, Typography, useTheme} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, padDecorator} from '../../_storyKit';
import {Panel} from '../../molecules/Panel';
import {PANEL_CONTENT_PADDING_STEPS, PanelContent} from '../../molecules/PanelContent';
import {PanelHeader} from '../../molecules/PanelHeader';
import {PropertyItem, type PropertyItemProps} from '../../molecules/PropertyItem';
import {PropertyList} from '../../molecules/PropertyList';
import {PanelGrid} from './PanelGrid';
import {PanelGridItem} from './PanelGridItem';
import {usePanelGridSpacing} from './usePanelGridSpacing';

/* -- demo cell: a labelled Panel that stretches to fill its grid cell -- */

const Cell = ({label, lines = 2}: {label: string; lines?: number}) => (
  <Panel fullHeight>
    <PanelHeader label={label} />
    <PanelContent>
      <Typography variant={'body2'} color={'text.secondary'} component={'div'}>
        {Array.from({length: lines}).map((_, i) => (
          <Box key={i} component={'p'} sx={{m: 0}}>
            Content line {i + 1}
          </Box>
        ))}
      </Typography>
    </PanelContent>
  </Panel>
);

const meta: Meta<typeof PanelGrid> = {
  title: 'design/organisms/PanelGrid',
  component: PanelGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A responsive 12-column grid for laying out panels. Each direct child is auto-wrapped in a ' +
          '`PanelGridItem` and the column split is derived from `maxColumns` (a per-breakpoint object or ' +
          'a single number). Wrap a child in `PanelGridItem` explicitly to control its own span. ' +
          '`PanelGrid` also propagates a "last path" flag (via `IsLastPanelContext`) so only the last ' +
          'panel on the last path grows to fill the available height — nest a `PanelGrid` inside a cell ' +
          'to build column/row compositions.',
      },
    },
    controls: {include: ['maxColumns']},
  },
  argTypes: {
    maxColumns: {
      control: {type: 'number', min: 1, max: 4},
      description: 'Maximum number of columns (single number) or a per-breakpoint object.',
    },
  },
  args: {maxColumns: 2},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof PanelGrid>;

// Placeholder body reused by every panel cell in the Playground below.
const CELL_LINES = ['Content line 1', 'Content line 2'];

/** Interactive — change `maxColumns` and watch the auto-layout reflow four panels. */
export const Playground: Story = {
  render: (args) => (
    <PanelGrid maxColumns={args.maxColumns}>
      {['Panel one', 'Panel two', 'Panel three', 'Panel four'].map((label) => (
        <Panel key={label} fullHeight>
          <PanelHeader label={label} />
          <PanelContent>
            <Typography variant={'body2'} color={'text.secondary'} component={'div'}>
              {CELL_LINES.map((line) => (
                <Box key={line} component={'p'} sx={{m: 0}}>
                  {line}
                </Box>
              ))}
            </Typography>
          </PanelContent>
        </Panel>
      ))}
    </PanelGrid>
  ),
};

/** Auto-layout — with no explicit items the columns follow `maxColumns`. */
export const AutoLayout: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Section title={'maxColumns = 2 — children auto-wrapped and split evenly'}>
      <PanelGrid maxColumns={2}>
        <Cell label={'Address'} />
        <Cell label={'Location'} />
        <Cell label={'Note'} />
        <Cell label={'Building numbers'} />
      </PanelGrid>
    </Section>
  ),
};

/* -- demo cell: a Panel holding a two-row PropertyList, to visualize label/value alignment -- */

const PropertyCell = ({
  title,
  labelWidth,
}: {
  title: string;
  labelWidth?: PropertyItemProps['labelWidth'];
}) => (
  <Panel fullHeight>
    <PanelHeader label={title} />
    <PanelContent>
      <PropertyList labelWidth={labelWidth}>
        <PropertyItem label={'City'}>Prague</PropertyItem>
        <PropertyItem label={'ZIP code'}>110 00</PropertyItem>
      </PropertyList>
    </PanelContent>
  </Panel>
);

/**
 * Uneven last row — three half-width cells, so the third wraps onto a row of its own. It keeps its
 * `md = 6` width instead of stretching to fill the row, which is what keeps its label/value columns
 * lined up with the two cells above it: `PropertyItem`'s label column is a percentage of its own
 * cell, so a stretched cell would silently widen its own label gutter.
 */
export const UnevenLastRow: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <PanelGrid>
      <PanelGridItem xs={12} md={6}>
        <PropertyCell title={'Contact'} />
      </PanelGridItem>
      <PanelGridItem xs={12} md={6}>
        <PropertyCell title={'Address'} />
      </PanelGridItem>
      <PanelGridItem xs={12} md={6}>
        <PropertyCell title={'Billing'} />
      </PanelGridItem>
    </PanelGrid>
  ),
};

/**
 * Mixed widths — a `PropertyItem`'s default `labelWidth` (`'40%'`) is a percentage of its own
 * cell, so cells of different declared widths get proportionally different label widths by
 * default. When cells are meant to read as one aligned table (e.g. a full-row field beside
 * half-width ones), give the wider cell's `PropertyList` a smaller `labelWidth` — scaled down by
 * how much wider it is — so every value column starts at the same position. A cell's width isn't
 * purely proportional to its span (a `Panel`'s own padding and the grid's column gap are fixed px
 * amounts that don't scale with it), so the scaled value is a `calc()` expression, not a flat
 * percentage.
 *
 * This is the manual form of the mechanism, for a grid composed by hand. Schema-driven grids need
 * none of it: `SchemaGridBox` derives the same `calc()` per cell from the spans, card padding and
 * column gap it already knows — the value below is exactly what it would compute here.
 */
export const MixedWidthLabels: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <MixedWidthLabelsGrid />,
};

// The full-row cell is twice as wide as the half-width reference, so its label gets half the
// percentage (20% for 40%), minus the fixed px that don't scale with the span: 20% of both sides'
// `PanelContent` padding and of the column gap — which follows density, so it is read, not assumed.
const MixedWidthLabelsGrid = () => {
  const theme = useTheme();
  const gapPx = parseFloat(theme.spacing(usePanelGridSpacing()));
  const paddingPx = 2 * parseFloat(theme.spacing(PANEL_CONTENT_PADDING_STEPS.medium));
  const scaled = `calc(20% - ${Math.round((0.2 * paddingPx + 0.2 * gapPx) * 100) / 100}px)`;
  return (
    <PanelGrid>
      <PanelGridItem xs={12} md={6}>
        <PropertyCell title={'Contact'} />
      </PanelGridItem>
      <PanelGridItem xs={12} md={6}>
        <PropertyCell title={'Address'} />
      </PanelGridItem>
      <PanelGridItem xs={12} md={12}>
        <PropertyCell
          title={'Notes'}
          labelWidth={{xs: '40%', sm: '40%', md: scaled, lg: scaled, xl: scaled}}
        />
      </PanelGridItem>
    </PanelGrid>
  );
};

/** Explicit spans — wrap children in `PanelGridItem` to control each cell's width. */
export const ExplicitSpans: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <PanelGrid>
      <PanelGridItem xs={12} md={8}>
        <Cell label={'Wide (md = 8)'} />
      </PanelGridItem>
      <PanelGridItem xs={12} md={4}>
        <Cell label={'Narrow (md = 4)'} />
      </PanelGridItem>
      <PanelGridItem xs={12}>
        <Cell label={'Full width (12)'} />
      </PanelGridItem>
    </PanelGrid>
  ),
};

/** Nested — a `PanelGrid` inside a cell stacks panels beside a taller one. */
export const Nested: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <PanelGrid>
      <PanelGridItem xs={12} md={6}>
        <Cell label={'Tall panel'} lines={8} />
      </PanelGridItem>
      <PanelGridItem xs={12} md={6}>
        <PanelGrid maxColumns={1}>
          <Cell label={'Stacked one'} />
          <Cell label={'Stacked two'} />
        </PanelGrid>
      </PanelGridItem>
    </PanelGrid>
  ),
};

/**
 * Nested column counts — a cell's own span becomes the column count of the grid inside it
 * (`PanelGridItem` passes it down through `PanelGridContext`), so a span is always a fraction of
 * the parent cell and never of the page. The outer grid splits 4 / 8, which makes the left cell a
 * 4-column grid and the right one an 8-column grid. Both hold items that read as halves of their
 * own cell — both are labelled `Half` — but the number expressing it differs per level: `md = 2`
 * on the left, `md = 4` on the right. Copying a span from one nesting level to another is what
 * silently changes a layout, and nesting deeper shrinks the counts further.
 *
 * The rows also show `PropertyItem`'s `auto` orientation reacting to the width it actually gets:
 * the narrow left cells fall below the container query's threshold and stack the label above the
 * value, while the wider right ones keep it beside — same markup, decided per cell.
 */
export const NestedColumnCounts: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <PanelGrid>
      <PanelGridItem xs={12} md={4}>
        <PanelGrid>
          {[1, 2, 3, 4].map((n) => (
            <PanelGridItem key={n} xs={12} md={2}>
              <PropertyCell title={'Half (md = 2)'} />
            </PanelGridItem>
          ))}
        </PanelGrid>
      </PanelGridItem>
      <PanelGridItem xs={12} md={8}>
        <PanelGrid>
          {[1, 2].map((n) => (
            <PanelGridItem key={n} xs={12} md={4}>
              <PropertyCell title={'Half (md = 4)'} />
            </PanelGridItem>
          ))}
        </PanelGrid>
      </PanelGridItem>
    </PanelGrid>
  ),
};
