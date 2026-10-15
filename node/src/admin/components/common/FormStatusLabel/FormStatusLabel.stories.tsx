import React, {useEffect} from 'react';
import {CoreAdminContext, Form, FormGroupContextProvider, TestMemoryRouter} from 'react-admin';
import {useFormContext} from 'react-hook-form';
import {TextInput} from '@admin/components/inputs/TextInput';
import {i18nProvider} from '@admin/pages/_i18n';
import {Box, Stack, Typography} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {FormStatusLabel} from './FormStatusLabel';

// ----------------------------------------------------------------------------
// A tiny harness that reproduces, without a whole tab box, the form-group state
// `FormStatusLabel` reads: one React Admin `Form`, one form group per label, each
// group holding a single (hidden) input so `useFormGroup` has a field to report
// on, and a seeder that drives each group into the requested state at rest.
// ----------------------------------------------------------------------------

type GroupState = 'default' | 'changed' | 'error' | 'both';

// React Admin's `Form` resets itself once on mount (applying its defaults), which would wipe any
// state set synchronously in an effect. Seeding on the next tick lands after that reset, so the
// dirty/error state sticks.
const Seeder = ({seed}: {seed: Record<string, GroupState>}) => {
  const {setValue, setError} = useFormContext();

  useEffect(() => {
    const id = setTimeout(() => {
      Object.entries(seed).forEach(([group, state]) => {
        if (state === 'changed' || state === 'both') {
          setValue(group, 'New value', {shouldDirty: true});
        }
        if (state === 'error' || state === 'both') {
          setError(group, {type: 'required', message: 'Required field'});
        }
      });
    }, 0);
    return () => clearTimeout(id);
  }, [seed, setValue, setError]);

  return null;
};

// The hidden input that makes a form group non-empty, so `useFormGroup(group)` tracks its state.
const GroupField = ({group}: {group: string}) => (
  <FormGroupContextProvider name={group}>
    <Box sx={{display: 'none'}}>
      <TextInput source={group} label={false} helperText={false} />
    </Box>
  </FormGroupContextProvider>
);

// Wraps `children` in the minimal Form context and registers + seeds one group per `seed` key.
const FormHarness = ({
  seed,
  children,
}: {
  seed: Record<string, GroupState>;
  children: React.ReactNode;
}) => (
  <TestMemoryRouter initialEntries={['/']}>
    <CoreAdminContext i18nProvider={i18nProvider}>
      <Form>
        {children}
        {Object.keys(seed).map((group) => (
          <GroupField key={group} group={group} />
        ))}
        <Seeder seed={seed} />
      </Form>
    </CoreAdminContext>
  </TestMemoryRouter>
);

// ----------------------------------------------------------------------------
// Playground — one label whose group state is driven from the Controls panel.
// ----------------------------------------------------------------------------

type PlaygroundProps = {
  /** The form-group state the label reflects. */
  state: GroupState;
  /** The label text — it keeps its normal colour in every state. */
  label: string;
};

const FormStatusLabelPlayground = ({state, label}: PlaygroundProps) => (
  <FormHarness seed={{field: state}}>
    <FormStatusLabel groupName="field">{label}</FormStatusLabel>
  </FormHarness>
);

/**
 * A tab (or wizard step) label with a form-group **status dot**. It renders the label text and, when
 * the named React Admin form group has unsaved-but-valid changes or validation errors, appends a
 * small coloured dot with an explanatory tooltip. Used by `SchemaBoxTab` and the wizard stepper.
 *
 * - **Unsaved change** (dirty & valid) → **yellow** dot.
 * - **Validation error** (invalid) → **red** dot.
 * - **Both change and error** → **red** dot — the error takes priority.
 *
 * The dot alone carries the status: the label text keeps its normal colour in every state.
 */
const meta = {
  title: 'admin/common/FormStatusLabel',
  component: FormStatusLabelPlayground,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      source: {
        // The story wraps the label in a Form harness; show the real call site instead.
        code: '<FormStatusLabel groupName={boxName}>{label}</FormStatusLabel>',
      },
    },
  },
  argTypes: {
    state: {
      name: 'Group state',
      control: 'select',
      options: ['default', 'changed', 'error', 'both'],
      description: 'default = no dot · changed = yellow · error = red · both = red (error wins)',
    },
    label: {name: 'Label text', control: 'text'},
  },
} satisfies Meta<typeof FormStatusLabelPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Switch `Group state` in the Controls panel and watch the dot colour (the text stays the same). */
export const Playground: Story = {
  args: {state: 'changed', label: 'Note'},
};

// ----------------------------------------------------------------------------
// States — the label in each state, stacked, so they read side by side.
// ----------------------------------------------------------------------------

const STATE_ROWS: {group: string; state: GroupState; caption: string}[] = [
  {group: 'row_default', state: 'default', caption: 'No change, no error → no dot'},
  {group: 'row_changed', state: 'changed', caption: 'Unsaved change → yellow dot'},
  {group: 'row_error', state: 'error', caption: 'Validation error → red dot'},
  {group: 'row_both', state: 'both', caption: 'Change and error → red dot (the error wins)'},
];

const FormStatusLabelStates = () => (
  <FormHarness seed={Object.fromEntries(STATE_ROWS.map((r) => [r.group, r.state]))}>
    <Stack spacing={2.5} sx={{minWidth: 320}}>
      {STATE_ROWS.map((row) => (
        <Stack key={row.group} spacing={0.5}>
          <FormStatusLabel groupName={row.group}>Note</FormStatusLabel>
          <Typography variant="caption" color="text.secondary">
            {row.caption}
          </Typography>
        </Stack>
      ))}
    </Stack>
  </FormHarness>
);

/**
 * The same label in each state, one under another: default (no dot), unsaved change (yellow dot),
 * validation error (red dot) and both at once (red dot — the error wins). The text colour never
 * changes; only the dot does.
 */
export const States: StoryObj = {
  // No Controls and no "Show code" — a Showcase story only demonstrates a fixed prop combination;
  // `Playground` above is the one story whose code is meant to be copy-pasted.
  parameters: {controls: {include: []}, docs: {canvas: {sourceState: 'none'}}},
  // `render` takes an (unused) parameter on purpose: Storybook infers `__isArgsStory` from the
  // function's arity (`render.length > 0`), and skips `controls.include` filtering entirely for a
  // zero-arity `render` — so a plain `() => ...` here would silently ignore the empty controls
  // table set above and fall back to showing every inferred prop.
  render: (_args) => <FormStatusLabelStates />,
};
