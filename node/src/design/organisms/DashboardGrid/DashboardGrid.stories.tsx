import React, {useState} from 'react';
import {Box, Chip, Stack, Table, TableBody, TableCell, TableRow, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../../molecules/ButtonsStack';
import {GhostPanel} from '../../molecules/GhostPanel';
import {DashboardGrid, type DashboardGridMode, type DashboardGridPanel} from './DashboardGrid';

/* -- placeholder panel contents (fill the grid cell) -- */

const ChartPlaceholder = () => (
  <Box
    sx={{display: 'flex', alignItems: 'flex-end', gap: 1, height: '100%', minHeight: 120, pb: 1}}
  >
    {[45, 70, 55, 90, 60, 80, 50].map((h, i) => (
      <Box
        key={i}
        sx={{flex: 1, height: `${h}%`, bgcolor: 'primary.main', opacity: 0.7, borderRadius: 1}}
      />
    ))}
  </Box>
);

const TablePlaceholder = () => (
  <Table size={'small'}>
    <TableBody>
      {[
        ['Acme Corp', '12'],
        ['Globex', '8'],
        ['Initech', '5'],
        ['Umbrella', '3'],
      ].map(([name, count]) => (
        <TableRow key={name}>
          <TableCell>{name}</TableCell>
          <TableCell align={'right'}>{count}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const AggregatePlaceholder = ({value, caption}: {value: string; caption: string}) => (
  <Box
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Typography variant={'h3'}>{value}</Typography>
    <Typography variant={'caption'} color={'text.secondary'}>
      {caption}
    </Typography>
  </Box>
);

const noop = () => {};

/** Edit / delete controls shown in each panel header while editing. */
const EditDelete = () => (
  <ButtonsStack
    surface={'iconButton'}
    buttons={
      [
        {label: 'Edit', icon: IconType.Edit, onClick: noop},
        {label: 'Delete', icon: IconType.Delete, color: 'error', onClick: noop},
      ] as ButtonDefinition[]
    }
  />
);

const WIDGET_TYPES = ['Table', 'Aggregate', 'Bar chart', 'Pie chart', 'Line chart'];

/** The add-panel affordance passed to `DashboardGrid` — a `GhostPanel` quick link. */
const AddWidgetGhost = () => (
  <GhostPanel
    icon={IconType.Add}
    title={'Add widget'}
    subtitle={'Select a widget type'}
    badges={WIDGET_TYPES.map((type) => (
      <Chip key={type} label={type} size={'small'} color={'default'} variant={'soft'} />
    ))}
    onClick={() => undefined}
  />
);

const SAMPLE_PANELS: DashboardGridPanel[] = [
  {
    id: 'orders',
    layout: {x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2},
    label: 'Orders by client',
    icon: IconType.BarChart,
    content: <ChartPlaceholder />,
  },
  {
    id: 'contracts',
    layout: {x: 6, y: 0, w: 6, h: 3, minW: 4, minH: 2},
    label: 'Overdue contracts',
    icon: IconType.Warning,
    iconColor: 'error',
    help: 'Contracts past their due date.',
    content: <TablePlaceholder />,
  },
  {
    id: 'revenue',
    layout: {x: 0, y: 3, w: 3, h: 2, minW: 2, minH: 2},
    label: 'Revenue',
    icon: IconType.CreditCard,
    iconColor: 'success',
    content: <AggregatePlaceholder value={'1.2M'} caption={'This quarter'} />,
  },
];

/**
 * Controlled demo — holds the panels' layouts in state and merges layout changes back, so
 * drag/resize actually persist within the story. Edit/delete actions are shown per mode.
 */
const mergeLayouts = (
  panels: DashboardGridPanel[],
  next: {id: string; layout: DashboardGridPanel['layout']}[]
): DashboardGridPanel[] =>
  panels.map((panel) => {
    const updated = next.find((item) => item.id === panel.id);
    return updated ? {...panel, layout: updated.layout} : panel;
  });

const DashboardGridDemo = ({mode}: {mode: DashboardGridMode}) => {
  const [panels, setPanels] = useState<DashboardGridPanel[]>(SAMPLE_PANELS);

  const handleLayoutChange = (next: {id: string; layout: DashboardGridPanel['layout']}[]) => {
    setPanels((current) => mergeLayouts(current, next));
  };

  const withActions = panels.map((panel) => ({
    ...panel,
    actions: mode === 'edit' ? <EditDelete /> : undefined,
  }));

  return (
    <DashboardGrid
      panels={withActions}
      mode={mode}
      onLayoutChange={handleLayoutChange}
      addPanel={<AddWidgetGhost />}
    />
  );
};

const meta: Meta<typeof DashboardGrid> = {
  title: 'design/organisms/DashboardGrid',
  component: DashboardGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A presentational, controlled 12-column responsive dashboard grid. In `detail` mode ' +
          'panels are static (stacked on narrow screens); in `edit` mode it enables drag + resize ' +
          'and shows a dot grid. It renders the standard `Panel` chrome from each panel definition ' +
          'and emits `onLayoutChange` — persistence, overlap validation, the add/edit flow and the ' +
          'mode toggle belong to the consumer. Drag from a panel header; resize from the bottom-right corner.',
      },
    },
    controls: {include: ['mode']},
  },
  argTypes: {
    mode: {control: 'inline-radio', options: ['detail', 'edit']},
  },
  args: {mode: 'detail'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof DashboardGrid>;

// `render` returns the local `DashboardGridDemo` helper (it owns the panels' layout state — see
// the "Hooks live in a top-level demo component" rule), so "Show code" on the autodocs page would
// otherwise show that helper's tag, so `docs.source.transform` below rebuilds the real usage from
// the story's *current* args instead — reactive, unlike a static `docs.source.code` override.
const buildPlaygroundSource = (mode: DashboardGridMode) => `<DashboardGrid
  panels={panels}
  mode=${JSON.stringify(mode)}
  onLayoutChange={handleLayoutChange}
  addPanel={<AddWidgetGhost />}
/>`;

/** Interactive instance — toggle mode in Controls, then drag/resize panels in edit mode. */
export const Playground: Story = {
  render: (args) => <DashboardGridDemo mode={args.mode ?? 'detail'} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: {mode?: DashboardGridMode}}) =>
          buildPlaygroundSource(args.mode ?? 'detail'),
      },
    },
  },
};

/** Read view — static panels, no drag/resize handles, stacked on narrow screens. */
export const Detail: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <DashboardGridDemo mode={'detail'} />,
};

/** Edit view — drag grip + resize corner on each panel, dot grid overlay. */
export const Edit: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <DashboardGridDemo mode={'edit'} />,
};

/** Empty state — detail shows a centered message; edit shows the add-panel ghost. */
export const Empty: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack spacing={4}>
      <Section title={'detail — centered empty message'}>
        <DashboardGrid panels={[]} mode={'detail'} />
      </Section>
      <Section title={'edit — add-panel ghost'}>
        <DashboardGrid panels={[]} mode={'edit'} addPanel={<AddWidgetGhost />} />
      </Section>
    </Stack>
  ),
};
