import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {NotFoundV1Svg} from '@assets/illustrations/svgs';
import {HabaricoLogo} from '@design/atoms/HabaricoLogo';
import {RouterLink} from '@design/atoms/RouterLink';
import {Box, Button, Container, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {_availableLanguages} from '../_mock';
// Mock settings so the language popover / mode toggle are live (no data layer in Storybook).
import {SettingsMockProvider} from '../contexts/SettingsContext';
import {SimpleLayout} from './SimpleLayout';

const meta: Meta<typeof SimpleLayout> = {
  title: 'design/layouts/shells/SimpleLayout',
  component: SimpleLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Minimal shell (logo header only) for standalone pages such as errors or maintenance. ' +
          'Pass `compact` to vertically center a narrow column; the demo below is a 404 page.',
      },
    },
    controls: {include: ['compact', 'appearance']},
  },
  argTypes: {
    compact: {control: 'boolean', description: 'Vertically centers a narrow content column.'},
    appearance: {
      control: 'boolean',
      description: 'Shows the light/dark mode toggle in the header.',
    },
  },
  args: {compact: true, appearance: true},
  decorators: [
    (Story) => (
      <MemoryRouter>
        <SettingsMockProvider>
          <Story />
        </SettingsMockProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SimpleLayout>;

// Demo content shown in the header "help" dialog.
const HelpContent = () => (
  <Box sx={{p: 3}}>
    <Typography variant={'h6'} sx={{mb: 1}}>
      Need help?
    </Typography>
    <Typography variant={'body2'} color={'text.secondary'}>
      If you reached this page by mistake, use the button below to return home, or contact support
      if the problem persists.
    </Typography>
  </Box>
);

/** Interactive instance — toggle `compact` and `appearance` from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <SimpleLayout
      compact={args.compact}
      logo={{Component: HabaricoLogo}}
      language={{availableLanguages: _availableLanguages}}
      appearance={args.appearance}
      help={{Component: HelpContent}}
    >
      <Container>
        <Typography variant={'h3'} sx={{mb: 2}}>
          Sorry, page not found!
        </Typography>

        <Typography sx={{color: 'text.secondary'}}>
          Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve mistyped the URL? Be
          sure to check your spelling.
        </Typography>

        <Box
          component={NotFoundV1Svg}
          sx={{
            width: 320,
            height: 'auto',
            my: {xs: 2, sm: 4},
          }}
        />

        <Button
          component={RouterLink}
          href={'/'}
          size={'large'}
          variant={'contained'}
          color={'inherit'}
        >
          Go to home
        </Button>
      </Container>
    </SimpleLayout>
  ),
};
