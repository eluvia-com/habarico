import React, {useState} from 'react';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {Icon, IconType} from '../../atoms/Icon';
import {InspectorField, InspectorPanel, InspectorSection} from './InspectorPanel';

const ICON_OPTIONS = [IconType.FilterList, IconType.Tune, IconType.Settings] as const;

const meta: Meta<typeof InspectorPanel> = {
  title: 'design/organisms/InspectorPanel',
  component: InspectorPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A dismissible panel anchored to the right edge, floating over a frosted backdrop. ' +
          'Its body is a scrollable column of grouped `InspectorSection`s (each an optional label ' +
          'plus `InspectorField`s), with an optional footer reset action. Presentational only — all ' +
          'state comes via props. The examples below use advanced list filters; the settings use of ' +
          'this shell is documented separately in `SettingsPanel`. Open it with the button below.',
      },
    },
    controls: {include: ['title', 'subtitle', 'icon', 'resetLabel', 'width']},
  },
  argTypes: {
    title: {control: 'text'},
    subtitle: {control: 'text'},
    icon: {control: 'select', options: ICON_OPTIONS},
    resetLabel: {control: 'text'},
    width: {
      control: {type: 'number', min: 280, max: 560, step: 20},
      description:
        'Panel width in px. The 280–560 control range is this story’s curated default, not a ' +
        "component limit — the prop takes any px value, capped only by the panel's own " +
        '`maxWidth: 100%` of the viewport.',
    },
  },
  args: {
    title: 'Filters',
    subtitle: 'Narrow down the properties list',
    icon: IconType.FilterList,
    resetLabel: 'Clear filters',
    width: 380,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof InspectorPanel>;

/** Advanced list filters — the canonical filter use of the shell. */
const FiltersDemo = (args: React.ComponentProps<typeof InspectorPanel>) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>('active');
  const [managed, setManaged] = useState(true);
  const [owned, setOwned] = useState(false);

  const reset = () => {
    setStatus(null);
    setManaged(false);
    setOwned(false);
  };

  return (
    <>
      <Button
        variant={'contained'}
        startIcon={<Icon icon={IconType.FilterList} size={18} />}
        onClick={() => setOpen(true)}
      >
        Filters
      </Button>
      <InspectorPanel {...args} open={open} onClose={() => setOpen(false)} onReset={reset}>
        <InspectorSection label={'Status'}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size={'small'}
            value={status}
            onChange={(_, value) => setStatus(value)}
          >
            <ToggleButton value={'active'}>Active</ToggleButton>
            <ToggleButton value={'archived'}>Archived</ToggleButton>
          </ToggleButtonGroup>
        </InspectorSection>
        <InspectorSection label={'Ownership'}>
          <Stack>
            <FormControlLabel
              control={
                <Checkbox checked={managed} onChange={(e) => setManaged(e.target.checked)} />
              }
              label={'Managed'}
            />
            <FormControlLabel
              control={<Checkbox checked={owned} onChange={(e) => setOwned(e.target.checked)} />}
              label={'Owned'}
            />
          </Stack>
        </InspectorSection>
      </InspectorPanel>
    </>
  );
};

// `render` returns the local `FiltersDemo` helper (it owns the open/filter state — see the "Hooks
// live in a top-level demo component" rule): a real, always-`open` panel is dangerous as story/docs
// scaffolding (its `Backdrop` fights the rest of the page — see `CustomDialogTitle`'s history), so
// the trigger-button pattern stays. "Show code" would otherwise show the wrapper's own tag, so
// `docs.source.transform` below rebuilds the real composed usage from the story's *current* args
// instead — reactive, unlike a static `docs.source.code` override.
const buildPlaygroundSource = (
  args: React.ComponentProps<typeof InspectorPanel>
) => `<InspectorPanel
  open={open}
  onClose={() => setOpen(false)}
  onReset={reset}
  title=${JSON.stringify(args.title)}
  subtitle=${JSON.stringify(args.subtitle)}
  icon=${JSON.stringify(args.icon)}
  resetLabel=${JSON.stringify(args.resetLabel)}
  width={${args.width}}
>
  <InspectorSection label="Status">
    <ToggleButtonGroup exclusive fullWidth size="small" value={status} onChange={(_, value) => setStatus(value)}>
      <ToggleButton value="active">Active</ToggleButton>
      <ToggleButton value="archived">Archived</ToggleButton>
    </ToggleButtonGroup>
  </InspectorSection>
  <InspectorSection label="Ownership">
    <Stack>
      <FormControlLabel control={<Checkbox checked={managed} onChange={(e) => setManaged(e.target.checked)} />} label="Managed" />
      <FormControlLabel control={<Checkbox checked={owned} onChange={(e) => setOwned(e.target.checked)} />} label="Owned" />
    </Stack>
  </InspectorSection>
</InspectorPanel>`;

/** Interactive instance — drive the shell's props from the Controls panel. */
export const Playground: Story = {
  render: (args) => <FiltersDemo {...args} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: React.ComponentProps<typeof InspectorPanel>}) =>
          buildPlaygroundSource(args),
      },
    },
  },
};

/** A richer filter set showing labelled sections and `InspectorField`s. */
const AdvancedFiltersDemo = () => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>('active');
  const [type, setType] = useState<string | null>('apartment');
  const [vacantOnly, setVacantOnly] = useState(false);

  const reset = () => {
    setStatus(null);
    setType(null);
    setVacantOnly(false);
  };

  return (
    <>
      <Button
        variant={'outlined'}
        startIcon={<Icon icon={IconType.Tune} size={18} />}
        onClick={() => setOpen(true)}
      >
        Advanced filters
      </Button>
      <InspectorPanel
        open={open}
        onClose={() => setOpen(false)}
        onReset={reset}
        title={'Filters'}
        subtitle={'Narrow down the properties list'}
        icon={IconType.FilterList}
        resetLabel={'Clear filters'}
      >
        <InspectorSection label={'Status'}>
          <InspectorField label={'State'}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size={'small'}
              value={status}
              onChange={(_, value) => setStatus(value)}
            >
              <ToggleButton value={'active'}>Active</ToggleButton>
              <ToggleButton value={'archived'}>Archived</ToggleButton>
            </ToggleButtonGroup>
          </InspectorField>
        </InspectorSection>

        <InspectorSection label={'Property'}>
          <InspectorField label={'Type'}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size={'small'}
              value={type}
              onChange={(_, value) => setType(value)}
            >
              <ToggleButton value={'apartment'}>Apartment</ToggleButton>
              <ToggleButton value={'house'}>House</ToggleButton>
            </ToggleButtonGroup>
          </InspectorField>
          <FormControlLabel
            control={
              <Checkbox checked={vacantOnly} onChange={(e) => setVacantOnly(e.target.checked)} />
            }
            label={'Vacant only'}
          />
        </InspectorSection>

        <InspectorSection label={'Ownership'}>
          <Stack>
            <FormControlLabel control={<Checkbox defaultChecked />} label={'Managed'} />
            <FormControlLabel control={<Checkbox />} label={'Owned'} />
          </Stack>
        </InspectorSection>
      </InspectorPanel>
    </>
  );
};

export const AdvancedFilters: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <AdvancedFiltersDemo />,
};
