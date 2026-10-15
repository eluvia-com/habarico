import React from 'react';
import {Autocomplete, Box, OutlinedInput, TextField} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {Panel} from '../Panel';
import {PanelContent} from '../PanelContent';
import {PanelHeader} from '../PanelHeader';
import {PropertyItem} from '../PropertyItem';
import {PropertyList} from './PropertyList';

/* -- sample field data reused across the stories -- */

const BASIC_PROPERTIES: {label: string; value: React.ReactNode; help?: string}[] = [
  {label: 'Residential unit', value: 'Yes'},
  {label: 'Unit number', value: '521Z2'},
  {label: 'Layout', value: '2 + 1'},
  {label: 'Area', value: '50 m²', help: 'Floor area excluding balconies and terraces.'},
  {label: 'Floor number', value: '2'},
  {label: 'Number of floors', value: '6'},
];

const LOCATION_PROPERTIES: {label: string; value: React.ReactNode}[] = [
  {label: 'Region', value: 'Prague'},
  {label: 'Municipality', value: 'Michle'},
  {label: 'District', value: 'Michle'},
  {label: 'ZIP code', value: '140 00'},
  {label: 'Street', value: 'Jihlavská'},
  {label: 'Number type', value: 'building no.'},
  {label: 'Number', value: '521'},
  {label: 'Orientation number', value: '62'},
];

const ReadItems = ({items}: {items: {label: string; value: React.ReactNode; help?: string}[]}) => (
  <>
    {items.map((item) => (
      <PropertyItem key={item.label} label={item.label} help={item.help}>
        {item.value}
      </PropertyItem>
    ))}
  </>
);

/* -- edit-mode inputs: the same items rendered with bare controls in the value slot -- */

const LAYOUTS = ['1 + kk', '1 + 1', '2 + kk', '2 + 1', '3 + 1'];

const EditItems = () => (
  <>
    {/* Read-only among the inputs: shorter than a field, so it relies on the list's `lineHeight`
        to stay centered against its label. */}
    <PropertyItem label={'Unit ID'}>{'521Z2-04'}</PropertyItem>
    <PropertyItem label={'Residential unit'}>
      <Autocomplete
        options={['Yes', 'No']}
        defaultValue={'Yes'}
        size={'small'}
        renderInput={(params) => <TextField {...params} />}
      />
    </PropertyItem>
    <PropertyItem label={'Unit number'}>
      <OutlinedInput size={'small'} fullWidth defaultValue={'521Z2'} />
    </PropertyItem>
    <PropertyItem label={'Layout'}>
      <Autocomplete
        options={LAYOUTS}
        defaultValue={'2 + 1'}
        size={'small'}
        renderInput={(params) => <TextField {...params} />}
      />
    </PropertyItem>
    <PropertyItem label={'Area'} help={'Floor area excluding balconies and terraces.'}>
      <OutlinedInput size={'small'} fullWidth defaultValue={'50'} endAdornment={'m²'} />
    </PropertyItem>
    <PropertyItem label={'Floor number'}>
      <OutlinedInput size={'small'} fullWidth defaultValue={'2'} />
    </PropertyItem>
    <PropertyItem label={'Number of floors'}>
      <OutlinedInput size={'small'} fullWidth defaultValue={'6'} />
    </PropertyItem>
  </>
);

const meta: Meta<typeof PropertyList> = {
  title: 'design/molecules/PropertyList',
  component: PropertyList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A responsive grid of `PropertyItem`s — the shared layout behind both read (detail) and ' +
          'edit (form) panels. Items flow into `columns` equal columns (one on `xs`); combined with ' +
          "each item's width-driven `auto` orientation, a single wide column reads as inline rows " +
          '(label beside value) and several narrow columns stack (label above value), with no ' +
          'per-item configuration. Shows a centered `emptyMessage` when empty. Purely presentational ' +
          'and Panel-agnostic — drop it inside a `Panel` (`PanelContent`), a `Dialog` or anywhere.',
      },
    },
    controls: {include: ['columns', 'columnGap', 'density', 'rowGap']},
  },
  argTypes: {
    columns: {control: {type: 'number', min: 1, max: 4}},
    columnGap: {control: {type: 'number', min: 0, max: 8}},
    density: {control: 'inline-radio', options: ['compact', 'standard', 'comfortable']},
    rowGap: {control: {type: 'number', min: 0, max: 8}},
  },
  args: {columns: 2, columnGap: 4, density: 'compact'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof PropertyList>;

type PlaygroundArgs = {
  columns?: number;
  columnGap?: number;
  density?: 'compact' | 'standard' | 'comfortable';
  rowGap?: number;
};

// The children are built by the local `ReadItems` helper (it maps the shared `BASIC_PROPERTIES`
// sample data), so "Show code" would otherwise print that opaque tag instead of the real
// `PropertyItem` children it expands to. `docs.source.transform` rebuilds that real usage
// (abbreviated) from the story's current args instead — reactive, unlike a static override.
const buildPlaygroundSource = ({columns, columnGap, density, rowGap}: PlaygroundArgs) => {
  const props = [
    columns !== undefined ? `columns={${columns}}` : null,
    columnGap !== undefined ? `columnGap={${columnGap}}` : null,
    density ? `density=${JSON.stringify(density)}` : null,
    rowGap !== undefined ? `rowGap={${rowGap}}` : null,
  ].filter(Boolean);
  return `<PropertyList ${props.join(' ')}>
  <PropertyItem label="Residential unit">Yes</PropertyItem>
  <PropertyItem label="Unit number">521Z2</PropertyItem>
  <PropertyItem label="Layout">2 + 1</PropertyItem>
  <PropertyItem label="Area" help="Floor area excluding balconies and terraces.">50 m²</PropertyItem>
  …
</PropertyList>`;
};

/**
 * Interactive instance — change `columns` in Controls and watch the label placement flip:
 * at 1 column the wide cells read inline (label beside value), at 2+ the narrow cells stack
 * (label above value). Same items, no orientation set — the container query does it.
 */
export const Playground: Story = {
  render: (args) => (
    <PropertyList {...args}>
      <ReadItems items={BASIC_PROPERTIES} />
    </PropertyList>
  ),
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: PlaygroundArgs}) => buildPlaygroundSource(args),
      },
    },
  },
};

/**
 * Density — `compact` (default) keeps the tight panel spacing; `standard` and `comfortable`
 * widen the row gap. Same semantics as `DataTable`, so a global density setting drives both.
 */
export const Densities: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
      {(['compact', 'standard', 'comfortable'] as const).map((density) => (
        <Box key={density} sx={{minWidth: 220}}>
          <Box sx={{mb: 1, color: 'text.secondary', fontSize: 13}}>{density}</Box>
          <PropertyList columns={1} density={density}>
            <ReadItems items={BASIC_PROPERTIES} />
          </PropertyList>
        </Box>
      ))}
    </Box>
  ),
};

/** Read, one wide column — labels sit beside their values (a basic-properties detail panel). */
export const ReadInline: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <PropertyList columns={1}>
      <ReadItems items={BASIC_PROPERTIES} />
    </PropertyList>
  ),
};

/**
 * Read, two narrow columns — labels stack above their values (a location detail panel). The
 * container is capped at a half-width panel so each cell is narrow enough to stack; widen
 * it and the cells flip to inline on their own.
 */
export const ReadStacked: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{maxWidth: 460}}>
      <PropertyList columns={2}>
        <ReadItems items={LOCATION_PROPERTIES} />
      </PropertyList>
    </Box>
  ),
};

/**
 * Edit — the same items with bare inputs in the value slot; layout is identical to the read
 * view. Capped at a half-width panel (as in a basic-properties edit form), so the narrow
 * cells stack the label above each input.
 */
export const EditForm: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{maxWidth: 460}}>
      <PropertyList columns={2}>
        <EditItems />
      </PropertyList>
    </Box>
  ),
};

/**
 * Edit, one wide column — `lineHeight="smallInput"` sets the row height for the whole form, so
 * every label lines up with the `small` input beside it. The first row is a read-only value
 * rather than an input: shorter than a field, it is centered in the same reserved height
 * instead of sitting at the top of its row.
 */
export const EditInline: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <PropertyList columns={1} lineHeight={'smallInput'}>
      <EditItems />
    </PropertyList>
  ),
};

/**
 * Nested lists — a one-column summary (full address + note) followed by a two-column
 * sub-list that breaks the address down into its parts. A `PropertyList` is a valid child
 * of another; the nested one carries its own `columns` and an optional `label` heading.
 */
export const Nested: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{maxWidth: 460}}>
      <PropertyList columns={1}>
        <PropertyItem label={'Address'}>Jihlavská 521/62, 140 00 Prague - Michle</PropertyItem>
        <PropertyItem label={'Note'}>Corner unit, entrance from the courtyard.</PropertyItem>
        <PropertyList columns={2} label={'Address breakdown'}>
          <ReadItems items={LOCATION_PROPERTIES} />
        </PropertyList>
      </PropertyList>
    </Box>
  ),
};

/**
 * Nested inside a multi-column parent — a full-width summary row spanning both columns,
 * then a nested breakdown that also spans, via `span="full"`.
 */
export const NestedSpanning: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <PropertyList columns={2} rowGap={3}>
      <PropertyItem label={'Address'} span={'full'}>
        Jihlavská 521/62, 140 00 Prague - Michle
      </PropertyItem>
      <PropertyList columns={2} span={'full'} label={'Address breakdown'}>
        <ReadItems items={LOCATION_PROPERTIES} />
      </PropertyList>
    </PropertyList>
  ),
};

/**
 * Inside a `Panel` — the usual home for a property list. `PanelContent` keeps its padding
 * (unlike a full-bleed `DataTable`), so the read fields sit inside the panel gutter.
 */
export const InPanel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Panel sx={{maxWidth: 520}}>
      <PanelHeader label={'Location'} icon={IconType.Home} />
      <PanelContent>
        <PropertyList columns={2}>
          <ReadItems items={LOCATION_PROPERTIES} />
        </PropertyList>
      </PanelContent>
    </Panel>
  ),
};

/** Empty state — a centered muted message when there are no items. */
export const Empty: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <PropertyList emptyMessage={'No properties found'}>{[]}</PropertyList>,
};
