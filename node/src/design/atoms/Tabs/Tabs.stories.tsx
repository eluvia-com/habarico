import React, {useState} from 'react';
import {Box, Tab, Tabs} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';

const VARIANTS = ['standard', 'scrollable', 'fullWidth'] as const;
const TEXT_COLORS = ['primary', 'secondary', 'inherit'] as const;

// More labels than fit at the demo's fixed width, so `variant="scrollable"` has something to
// actually scroll — with only 2-3 short tabs there's nothing to overflow and the arrows never
// appear.
const PLAYGROUND_LABELS = [
  'Overview',
  'Properties',
  'Owners',
  'Documents',
  'Contracts',
  'Messages',
  'Settings',
  'Archive',
];

type TabsStoryArgs = {
  variant: (typeof VARIANTS)[number];
  centered: boolean;
  textColor: (typeof TEXT_COLORS)[number];
};

const meta = {
  title: 'design/atoms/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Switches between related views, controlled via the selected index.',
      },
    },
    controls: {include: ['variant', 'centered', 'textColor']},
  },
  argTypes: {
    variant: {control: 'inline-radio', options: VARIANTS},
    centered: {control: 'boolean'},
    textColor: {control: 'inline-radio', options: TEXT_COLORS},
  },
  args: {variant: 'standard', centered: false, textColor: 'primary'},
  decorators: [padDecorator],
} satisfies Meta<TabsStoryArgs>;

export default meta;
type Story = StoryObj<TabsStoryArgs>;

/**
 * Interactive instance — drive every prop from the Controls panel. Fixed at 360px wide with eight
 * tabs, so `variant="scrollable"` has enough overflow to show its scroll arrows (drag the tab strip
 * or click an arrow to scroll); `variant="standard"` shows the same overflow spilling out with no
 * scrolling, which is what `scrollable` fixes.
 */
export const Playground: Story = {
  render: function TabsPlayground({variant, centered, textColor}) {
    const [value, setValue] = useState(0);
    return (
      <Box sx={{maxWidth: 360}}>
        <Tabs
          value={value}
          onChange={(_event, next) => setValue(next)}
          variant={variant}
          centered={centered}
          textColor={textColor}
        >
          {PLAYGROUND_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>
    );
  },
};

/** `variant="fullWidth"` stretches the tabs to fill the container — shown at full width. */
export const FullWidth: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: function FullWidthTabs() {
    const [value, setValue] = useState(0);
    return (
      <Tabs value={value} onChange={(_event, next) => setValue(next)} variant={'fullWidth'}>
        <Tab label={'Item One'} />
        <Tab label={'Item Two'} />
        <Tab label={'Item Three'} />
      </Tabs>
    );
  },
};
