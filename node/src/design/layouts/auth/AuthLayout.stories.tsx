import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {HabaricoLogo} from '@design/atoms/HabaricoLogo';
import {LabelDivider} from '@design/atoms/LabelDivider';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {PasswordField} from '@design/atoms/PasswordField';
import {SocialIcon, SocialIconType} from '@design/atoms/SocialIcon';
import {Box, IconButton, Link, TextField, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {_availableLanguages} from '../_mock';
// Mock settings so the language popover / mode toggle are live (no data layer in Storybook).
import {SettingsMockProvider} from '../contexts/SettingsContext';
import {AuthLayout} from './AuthLayout';

const meta: Meta<typeof AuthLayout> = {
  title: 'design/layouts/shells/AuthLayout',
  component: AuthLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Centered, single-column shell for unauthenticated pages (sign-in, password reset). ' +
          'It renders the logo, a language popover and a light/dark toggle around the provided ' +
          '`children`; here the children are a demo sign-in form.',
      },
    },
    controls: {include: ['appearance']},
  },
  argTypes: {
    appearance: {
      control: 'boolean',
      description: 'Shows the light/dark mode toggle in the header.',
    },
  },
  args: {appearance: true},
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

type Story = StoryObj<typeof AuthLayout>;

// Demo content shown in the header "help" dialog.
const HelpContent = () => (
  <Box sx={{p: 3}}>
    <Typography variant={'h6'} sx={{mb: 1}}>
      Need help signing in?
    </Typography>
    <Typography variant={'body2'} color={'text.secondary'}>
      Use your work email and password. If you’ve forgotten your password, use the “Forgot
      password?” link, or contact your administrator.
    </Typography>
  </Box>
);

const SignInForm = () => (
  <Box display={'flex'} flexDirection={'column'} alignItems={'flex-end'}>
    <TextField
      fullWidth
      name={'email'}
      label={'Email address'}
      defaultValue={'hello@gmail.com'}
      slotProps={{inputLabel: {shrink: true}}}
      sx={{mb: 3}}
    />

    <Link variant={'body2'} color={'inherit'} sx={{mb: 1.5}}>
      Forgot password?
    </Link>

    <PasswordField
      fullWidth
      name={'password'}
      label={'Password'}
      defaultValue={'@demo1234'}
      slotProps={{inputLabel: {shrink: true}}}
      sx={{mb: 4}}
    />

    <LoadingButton fullWidth size={'large'} type={'submit'} color={'inherit'} variant={'contained'}>
      Sign in
    </LoadingButton>
  </Box>
);

/** Interactive instance — toggle `appearance` (the light/dark switch) from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <AuthLayout
      logo={{Component: HabaricoLogo}}
      language={{availableLanguages: _availableLanguages}}
      appearance={args.appearance}
      help={{Component: HelpContent}}
    >
      <Box gap={1.5} display={'flex'} flexDirection={'column'} alignItems={'center'} sx={{mb: 5}}>
        <Typography variant={'h5'}>Sign in</Typography>
        <Typography variant={'body2'} color={'text.secondary'}>
          Don’t have an account?
          <Link variant={'subtitle2'} sx={{ml: 0.5}}>
            Get started
          </Link>
        </Typography>
      </Box>

      <SignInForm />

      <LabelDivider label={'or'} />

      <Box gap={1} display={'flex'} justifyContent={'center'}>
        <IconButton color={'inherit'}>
          <SocialIcon icon={SocialIconType.Google} />
        </IconButton>
        <IconButton color={'inherit'}>
          <SocialIcon icon={SocialIconType.GitHub} />
        </IconButton>
        <IconButton color={'inherit'}>
          <SocialIcon icon={SocialIconType.X} />
        </IconButton>
      </Box>
    </AuthLayout>
  ),
};
