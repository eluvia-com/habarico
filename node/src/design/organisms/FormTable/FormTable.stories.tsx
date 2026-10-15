import React, {useState} from 'react';
import {MenuItem, OutlinedInput, Paper, TextField} from '@mui/material';
import {type Decorator, Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {Panel} from '../../molecules/Panel';
import {PanelContent} from '../../molecules/PanelContent';
import {PanelHeader} from '../../molecules/PanelHeader';
import {FormTable, type FormTableColumn, type FormTableDensity} from './FormTable';

// The row cards use `background.neutral`, which equals the story canvas (`background.default`) in
// light mode — so on the bare canvas they'd be invisible. Drop each story (except `InPanel`, which
// brings its own `Panel` surface) onto an opaque `Paper` so the neutral cards read against it.
const onPaper: Decorator = (Story) => (
  <Paper sx={{p: 2, maxWidth: 720}}>
    <Story />
  </Paper>
);

/* -- sample row shape: a part a flat "consists of" (see the mockup) -- */

type Part = {type: string; note: string};

const TYPE_OPTIONS = ['Hallway', 'Room', 'Kitchen', 'Bathroom', 'Toilet'];

const INITIAL_PARTS: Part[] = [
  {type: 'Hallway', note: ''},
  {type: 'Room', note: ''},
  {type: 'Kitchen', note: 'incl. balcony'},
];

const newPart = (): Part => ({type: '', note: ''});

type FormTableArgs = {
  addLabel: string;
  disabled: boolean;
  addDisabled: boolean;
  emptyMessage: string;
  density: FormTableDensity;
  inline: boolean;
};

/**
 * A stateful demo — `FormTable` owns the row structure (add/remove/clear via `onChange`), while the
 * cells here self-bind their values into the demo's local state.
 */
const FormTableDemo = ({
  addLabel,
  disabled,
  addDisabled,
  emptyMessage,
  density,
  inline,
}: FormTableArgs) => {
  const [rows, setRows] = useState<Part[]>(INITIAL_PARTS);

  const setCell = (index: number, key: keyof Part, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === index ? {...row, [key]: value} : row)));

  const columns: FormTableColumn<Part>[] = [
    {
      key: 'type',
      // Only shown as a `PropertyItem` label in the stacked (`inline={false}`) layout — the inline
      // layout renders the `TextField`'s own label instead (see `label` below), matching how
      // `FormArrayInput` swaps its children's `label` prop for the surrounding column's.
      label: 'Type',
      render: (row, i) => (
        <TextField
          select
          size={'small'}
          fullWidth
          label={inline ? 'Type' : undefined}
          value={row.type}
          disabled={disabled}
          onChange={(e) => setCell(i, 'type', e.target.value)}
        >
          {TYPE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
    {
      key: 'note',
      label: 'Note',
      render: (row, i) => (
        <OutlinedInput
          size={'small'}
          fullWidth
          placeholder={'Room state'}
          value={row.note}
          disabled={disabled}
          onChange={(e) => setCell(i, 'note', e.target.value)}
        />
      ),
    },
  ];

  return (
    <FormTable
      value={rows}
      onChange={setRows}
      columns={columns}
      createRow={newPart}
      disabled={disabled}
      addDisabled={addDisabled}
      density={density}
      inline={inline}
      addLabel={addLabel}
      emptyMessage={emptyMessage}
      countLabel={(count) => `${count} objects`}
    />
  );
};

const meta: Meta<typeof FormTable> = {
  title: 'design/organisms/FormTable',
  component: FormTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The editable counterpart to `DataTable`: a form layout whose value is an **array of ' +
          'objects** (rows). Each row is a neutral card of column inputs plus a trailing delete ' +
          'action; a footer shows the row count, an "Add" button and a `⋮` overflow menu with ' +
          '"Clear all". Columns take a flex ratio (`flex`, default 1 → equal widths) and a `render` ' +
          'that supplies the cell input — the input binds its own value, so `FormTable` owns only ' +
          'the row **structure**: `onChange` fires with the next array on add / remove / clear. A ' +
          'cell `render` may return `null` to stay empty while keeping columns aligned (e.g. ' +
          'conditional inputs, handled by the caller). Purely presentational and Panel-agnostic — ' +
          'drop it inside a `Panel` (`PanelContent`).',
      },
    },
    controls: {
      include: ['density', 'inline', 'addLabel', 'disabled', 'addDisabled', 'emptyMessage'],
    },
  },
  argTypes: {
    addLabel: {control: 'text'},
    disabled: {control: 'boolean'},
    addDisabled: {control: 'boolean'},
    emptyMessage: {control: 'text'},
    density: {control: 'inline-radio', options: ['compact', 'standard', 'comfortable']},
    inline: {control: 'boolean'},
  },
  args: {
    addLabel: 'Add',
    disabled: false,
    addDisabled: false,
    emptyMessage: 'No objects yet',
    density: 'standard',
    inline: true,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof FormTable>;

// `render` returns the local `FormTableDemo` helper (it owns the row state — see the "Hooks live
// in a top-level demo component" rule), so "Show code" would otherwise show that helper's tag, so
// `docs.source.transform` below rebuilds the real usage from the story's *current* args instead —
// reactive, unlike a static `docs.source.code` override.
const buildPlaygroundSource = (args: FormTableArgs) => `<FormTable
  value={rows}
  onChange={setRows}
  columns={[
    {
      key: "type",
      label: "Type",
      render: (row, i) => (
        <TextField select size="small" fullWidth label="Type" value={row.type}
          onChange={(e) => setCell(i, "type", e.target.value)}>
          {typeOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </TextField>
      ),
    },
    {
      key: "note",
      label: "Note",
      render: (row, i) => (
        <OutlinedInput size="small" fullWidth placeholder="Room state" value={row.note}
          onChange={(e) => setCell(i, "note", e.target.value)} />
      ),
    },
  ]}
  createRow={newPart}
  density=${JSON.stringify(args.density)}
  inline={${args.inline}}
  addLabel=${JSON.stringify(args.addLabel)}
  disabled={${args.disabled}}
  addDisabled={${args.addDisabled}}
  emptyMessage=${JSON.stringify(args.emptyMessage)}
  countLabel={(count) => \`\${count} objects\`}
/>`;

/** Interactive instance — the bare component: add rows, edit cells, delete a row, or clear all. */
export const Playground: Story = {
  decorators: [onPaper],
  render: (args) => <FormTableDemo {...(args as unknown as FormTableArgs)} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: FormTableArgs}) => buildPlaygroundSource(args),
      },
    },
  },
};

/**
 * Density — `standard` (default) keeps the current spacing; `compact` / `comfortable` tighten / open
 * both the gap between row cards and each card's padding. Same semantics as `DataTable` / `DataGrid`.
 */
export const Densities: Story = {
  decorators: [onPaper],
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {(['compact', 'standard', 'comfortable'] as const).map((density) => (
        <Section key={density} title={density}>
          <FormTableDemo
            addLabel={'Add'}
            disabled={false}
            addDisabled={false}
            emptyMessage={'No objects yet'}
            density={density}
            inline={true}
          />
        </Section>
      ))}
    </Showcase>
  ),
};

/**
 * Inside a `Panel` — the real detail-view context, with `PanelContent paddingSize="small"` so the
 * rows sit snugly under the header (as in the "Flat consists of" mockup).
 */
export const InPanel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Panel sx={{maxWidth: 720}}>
      <PanelHeader label={'Flat consists of'} icon={IconType.Home} />
      <PanelContent>
        <FormTableDemo
          addLabel={'Add'}
          disabled={false}
          addDisabled={false}
          emptyMessage={'No objects yet'}
          density={'standard'}
          inline={true}
        />
      </PanelContent>
    </Panel>
  ),
};

/* -- Conditional cells: a middle column that only renders for some rows -- */

type Key = {label: string; type: string; purpose: string};

const INITIAL_KEYS: Key[] = [
  {label: '3', type: 'Chip', purpose: 'front door'},
  {label: '0', type: 'Key', purpose: ''},
  {label: '1', type: 'Key', purpose: 'mailbox'},
];

const ConditionalDemo = () => {
  const [rows, setRows] = useState<Key[]>(INITIAL_KEYS);
  const setCell = (index: number, key: keyof Key, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === index ? {...row, [key]: value} : row)));

  const columns: FormTableColumn<Key>[] = [
    {
      key: 'label',
      flex: 0.5,
      render: (row, i) => (
        <OutlinedInput
          size={'small'}
          fullWidth
          value={row.label}
          onChange={(e) => setCell(i, 'label', e.target.value)}
        />
      ),
    },
    {
      key: 'type',
      render: (row, i) => (
        <TextField
          select
          size={'small'}
          fullWidth
          label={'Type'}
          value={row.type}
          onChange={(e) => setCell(i, 'type', e.target.value)}
        >
          {['Chip', 'Key', 'Card'].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
    {
      key: 'purpose',
      // Only chips carry a purpose here — other rows leave the cell empty (but keep the column).
      render: (row, i) =>
        row.type === 'Chip' ? (
          <TextField
            size={'small'}
            fullWidth
            label={'Key purpose'}
            value={row.purpose}
            onChange={(e) => setCell(i, 'purpose', e.target.value)}
          />
        ) : null,
    },
  ];

  return (
    <FormTable
      value={rows}
      onChange={setRows}
      columns={columns}
      createRow={() => ({label: '', type: 'Key', purpose: ''})}
      countLabel={(count) => `${count} objects`}
    />
  );
};

const EmptyDemo = () => {
  const [rows, setRows] = useState<Part[]>([]);
  return (
    <FormTable
      value={rows}
      onChange={setRows}
      columns={[{key: 'note', render: () => <OutlinedInput size={'small'} fullWidth />}]}
      createRow={newPart}
      emptyMessage={'No objects yet'}
      countLabel={(count) => `${count} objects`}
    />
  );
};

// A list whose first row is fixed — `canRemoveRow` hides that row's delete action while leaving the
// rest removable, the shape a checklist row takes when nothing stands behind it to delete.
const LockedRowDemo = () => {
  const [rows, setRows] = useState<Part[]>(INITIAL_PARTS);
  const setCell = (index: number, key: keyof Part, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === index ? {...row, [key]: value} : row)));

  return (
    <FormTable
      value={rows}
      onChange={setRows}
      columns={[
        {
          key: 'note',
          render: (row, i) => (
            <OutlinedInput
              size={'small'}
              fullWidth
              value={row.note}
              onChange={(e) => setCell(i, 'note', e.target.value)}
            />
          ),
        },
      ]}
      createRow={newPart}
      canRemoveRow={(_row, index) => index !== 0}
      countLabel={(count) => `${count} objects`}
    />
  );
};

/** Empty state, a row whose delete action is withheld, and a mixed layout where a middle column renders only for some rows. */
export const States: Story = {
  decorators: [onPaper],
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section
        title={'Empty'}
        description={'A muted message, with the footer still offering "Add".'}
      >
        <EmptyDemo />
      </Section>
      <Section
        title={'Row without a delete action'}
        description={
          'The first row answers `canRemoveRow` with `false`: its delete button keeps its track — ' +
          "so every row's columns stay in line — but is invisible and inert."
        }
      >
        <LockedRowDemo />
      </Section>
      <Section
        title={'Conditional cells & flex ratios'}
        description={
          'The first column is narrower (flex 0.5); the "Key purpose" cell renders only for chip ' +
          'rows, staying empty (but aligned) otherwise.'
        }
      >
        <ConditionalDemo />
      </Section>
    </Showcase>
  ),
};
