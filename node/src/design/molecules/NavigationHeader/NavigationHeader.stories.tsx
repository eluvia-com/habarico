import React, {useState} from 'react';
import {Box, Step, StepButton, Stepper, Tab, Tabs, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Showcase, Section as StorySection, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../ButtonsStack';
import {Section} from '../Section';
import {NavigationHeader} from './NavigationHeader';

const noop = () => {};

const ACTIONS: ButtonDefinition[] = [
  {label: 'Export', icon: IconType.Download, onClick: noop},
  {label: 'Add', icon: IconType.Add, onClick: noop},
];

/** A couple of contained buttons — the toolbar a tab box pins to the right of its tab strip. */
const TabActions = () => (
  <ButtonsStack surface={'button'} variant={'contained'} maxVisible={2} buttons={ACTIONS} />
);

/** Placeholder body — a `Section` is full-bleed, so consumers add their own padding. */
const SampleBody = () => (
  <Typography variant={'body2'} color={'text.secondary'} sx={{pt: 2}}>
    Tab panel body. The content of the active tab renders here.
  </Typography>
);

// The tab strip is controlled state, so it lives in a component (never inside a `render` arrow — the
// "Show code" serializer re-invokes `render` outside the providers and a hook would crash there).
const TabStrip = ({count = 3}: {count?: number}) => {
  const [value, setValue] = useState(0);
  return (
    <Tabs
      value={value}
      onChange={(_event, next) => setValue(next)}
      variant={'scrollable'}
      // `auto`: no scroll buttons until the strip overflows; when it does, both appear and the
      // direction that can't scroll is greyed (design theme `MuiTabs` override), matching the tab box.
      scrollButtons={'auto'}
      allowScrollButtonsMobile
    >
      {Array.from({length: count}, (_unused, index) => (
        <Tab key={index} label={`Tab ${index + 1}`} />
      ))}
    </Tabs>
  );
};

// The other strip the header carries: a wizard's `Stepper`. Same slot, same right-aligned actions.
const StepperStrip = ({count = 3}: {count?: number}) => {
  const [active, setActive] = useState(0);
  return (
    <Stepper activeStep={active} nonLinear>
      {Array.from({length: count}, (_unused, index) => (
        <Step key={index} completed={index < active}>
          <StepButton onClick={() => setActive(index)}>{`Step ${index + 1}`}</StepButton>
        </Step>
      ))}
    </Stepper>
  );
};

type HeaderArgs = {
  actions: boolean;
  tabs: number;
};

/** Header wired from the Controls args, mounted inside a `Section`. */
const HeaderDemo = ({actions, tabs}: HeaderArgs) => (
  <Box sx={{maxWidth: 560}}>
    <Section>
      <NavigationHeader actions={actions ? <TabActions /> : undefined}>
        <TabStrip count={tabs} />
      </NavigationHeader>
      <SampleBody />
    </Section>
  </Box>
);

const meta: Meta<typeof HeaderDemo> = {
  title: 'design/molecules/NavigationHeader',
  component: HeaderDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A header row carrying a horizontal navigation strip — a `Tabs` (tab box) or a `Stepper` ' +
          '(wizard box) — and an optional right-aligned actions slot. The navigation-strip ' +
          'counterpart to `SectionHeader`: the strip takes the available width and scrolls when it ' +
          'overflows; the actions stay pinned flush to the right. Card-less and fully flush (no ' +
          'surface, no divider, no padding of its own), so it drops onto a page background or into ' +
          'a card body alike. The tab and wizard boxes use it: their toolbar actions land here when ' +
          'the box is card-less, and in the card header when it has a label.',
      },
    },
    controls: {include: ['actions', 'tabs']},
  },
  argTypes: {
    actions: {control: 'boolean'},
    tabs: {control: {type: 'number', min: 1, max: 8}},
  },
  args: {
    actions: true,
    tabs: 3,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof HeaderDemo>;

// `render` returns the local `HeaderDemo` wrapper (it owns the tab strip's `useState`), so "Show
// code" would otherwise print that wrapper's tag. `docs.source.transform` rebuilds the real,
// composed usage from the story's current args instead — reactive, unlike a static override.
const buildPlaygroundSource = ({actions, tabs}: HeaderArgs) => `<NavigationHeader${
  actions
    ? ' actions={<ButtonsStack surface="button" variant="contained" buttons={headerActions} />}'
    : ''
}>
  <Tabs value={value} onChange={(_event, next) => setValue(next)} variant="scrollable" scrollButtons="auto">
${Array.from({length: tabs}, (_unused, index) => `    <Tab label="Tab ${index + 1}" />`).join('\n')}
  </Tabs>
</NavigationHeader>`;

/** Interactive instance — toggle the actions and change the tab count from the Controls panel. */
export const Playground: Story = {
  render: (args) => <HeaderDemo {...args} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: HeaderArgs}) => buildPlaygroundSource(args),
      },
    },
  },
};

/** The header configurations, including the action-less variant and an overflowing tab strip. */
export const Anatomy: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {(
        [
          {
            title: 'Tabs + actions (actions pinned flush to the right)',
            node: (
              <NavigationHeader actions={<TabActions />}>
                <TabStrip />
              </NavigationHeader>
            ),
          },
          {
            title: 'Tabs only (no actions)',
            node: (
              <NavigationHeader>
                <TabStrip />
              </NavigationHeader>
            ),
          },
          {
            title: 'Many tabs (the strip scrolls; actions keep their place)',
            node: (
              <NavigationHeader actions={<TabActions />}>
                <TabStrip count={8} />
              </NavigationHeader>
            ),
          },
          {
            title: 'Stepper + actions (the wizard box carries a Stepper here instead of Tabs)',
            node: (
              <NavigationHeader actions={<TabActions />}>
                <StepperStrip />
              </NavigationHeader>
            ),
          },
        ] as const
      ).map(({title, node}) => (
        <StorySection key={title} title={title}>
          <Box sx={{width: 560}}>
            <Section>{node}</Section>
          </Box>
        </StorySection>
      ))}
    </Showcase>
  ),
};
