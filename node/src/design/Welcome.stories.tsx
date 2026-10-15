import React from 'react';
import {Box, Card, Chip, Divider, Stack, Typography, useTheme} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
// Loads the MUI theme module augmentations (theme.customShadows, theme.radius,
// background.neutral, …) into this file's program — story files are excluded
// from tsconfig, so the augmentations aren't picked up transitively otherwise.
import type {} from './theme/core';

/**
 * Documentation page for the `src/design/` layer — explains its purpose and where
 * it sits in the library's layered architecture (foundation → design → admin →
 * schema). Token visualizations live in the sibling `design/Theme`
 * stories. Styled as a centered, card-based doc page; theme-aware so it also works
 * in light and dark.
 */
const meta: Meta = {
  title: 'design/Welcome',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

// ----------------------------------------------------------------------
// Layered-architecture diagram
// ----------------------------------------------------------------------

interface LayerInfo {
  name: string;
  blurb: string;
  highlight?: boolean;
}

const LAYERS: LayerInfo[] = [
  {
    name: 'schema',
    blurb: 'Schema-driven: input = Habarico schema → output = a complete admin IS.',
  },
  {
    name: 'admin',
    blurb:
      'React Admin binding: generic, resource-aware widgets (fields, inputs, buttons, datagrid). Data-aware, but schema-agnostic.',
  },
  {
    name: 'design',
    blurb:
      'Pure presentation, ZERO backend/API. Panels, hero, list & filters, dialogs, layout shells, common primitives.',
    highlight: true,
  },
  {
    name: 'foundation',
    blurb: 'Shared kernel: theme & tokens, base types (@typing), generic utils, assets.',
  },
];

const LayerStack = () => {
  const theme = useTheme();
  return (
    <Box>
      <Stack spacing={1}>
        {LAYERS.map((layer) => (
          <Box
            key={layer.name}
            sx={{
              p: 2,
              borderRadius: `${theme.radius.md}px`,
              border: `1px solid ${
                layer.highlight ? theme.palette.primary.main : theme.palette.divider
              }`,
              bgcolor: layer.highlight
                ? theme.palette.action.hover
                : theme.palette.background.neutral,
            }}
          >
            <Stack direction={'row'} spacing={1.5} alignItems={'baseline'} flexWrap={'wrap'}>
              <Typography
                variant={'subtitle2'}
                sx={{
                  minWidth: 92,
                  fontFamily: 'monospace',
                  color: layer.highlight ? 'primary.main' : 'text.primary',
                }}
              >
                {layer.name}
              </Typography>
              <Typography variant={'body2'} color={'text.secondary'}>
                {layer.blurb}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Typography variant={'caption'} color={'text.secondary'} sx={{mt: 1.5, display: 'block'}}>
        Dependencies flow strictly downward — <code>design</code> may only import from{' '}
        <code>foundation</code>, never from <code>admin</code> or <code>schema</code>.
      </Typography>
    </Box>
  );
};

const Bullet = ({children}: {children: React.ReactNode}) => (
  <Stack direction={'row'} spacing={1.5} alignItems={'flex-start'}>
    <Box
      sx={{
        mt: '7px',
        width: 6,
        height: 6,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor: 'primary.main',
      }}
    />
    <Typography variant={'body2'} color={'text.secondary'}>
      {children}
    </Typography>
  </Stack>
);

const SectionTitle = ({children}: {children: React.ReactNode}) => (
  <Typography variant={'overline'} color={'text.secondary'} sx={{letterSpacing: 1}}>
    {children}
  </Typography>
);

// ----------------------------------------------------------------------
// Story
// ----------------------------------------------------------------------

export const Overview: Story = {
  render: () => (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
        py: {xs: 4, md: 8},
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 820,
          p: {xs: 3, md: 5},
          boxShadow: (t) => t.customShadows.card,
        }}
      >
        <Stack spacing={4}>
          {/* Header */}
          <Box>
            <Chip label={'src/design'} size={'small'} color={'primary'} variant={'outlined'} />
            <Typography variant={'h3'} sx={{mt: 2}}>
              Design layer
            </Typography>
            <Typography variant={'body1'} color={'text.secondary'} sx={{mt: 1.5}}>
              The presentation layer of <code>@eluvia/habarico</code>: purely presentational,
              schema-agnostic UI primitives. Components here are <strong>props-driven</strong> and
              know nothing about the backend, React Admin, or the Habarico schema — you give them
              data and callbacks, they render. The same primitives are reused by the schema-driven
              core and by hand-built custom screens, so everything looks and behaves consistently.
            </Typography>
          </Box>

          <Divider />

          {/* Architecture */}
          <Stack spacing={2}>
            <SectionTitle>Where it sits</SectionTitle>
            <Typography variant={'body2'} color={'text.secondary'}>
              The library is split into four architectural layers with one-way dependencies.{' '}
              <code>design</code> is the pure-presentation layer.
            </Typography>
            <LayerStack />
          </Stack>

          <Divider />

          {/* What belongs here */}
          <Stack spacing={2}>
            <SectionTitle>What belongs here</SectionTitle>
            <Stack spacing={1.25}>
              <Bullet>
                Standalone components: <strong>Panel</strong> (root/nested + content types),{' '}
                <strong>ObjectHero</strong>, <strong>SearchField</strong>,{' '}
                <strong>InspectorPanel</strong>, <strong>FormTable</strong>, <strong>Dialog</strong>
                .
              </Bullet>
              <Bullet>
                Presentational layout parts: app bar, sidebar &amp; footer, menu with guide lines,
                backdrop.
              </Bullet>
              <Bullet>
                The redesigned <strong>List / datagrid</strong>, box containers, and pure common
                primitives.
              </Bullet>
            </Stack>
          </Stack>

          <Divider />

          {/* Rules */}
          <Stack spacing={2}>
            <SectionTitle>Rules</SectionTitle>
            <Stack spacing={1.25}>
              <Bullet>
                No imports from <code>react-admin</code>, <code>@schema</code> (schema-driven core),
                or any data/schema context. If a component needs backend or schema awareness, it
                belongs in a higher layer.
              </Bullet>
              <Bullet>
                Style from the theme (<code>@design/theme</code>) — colors, spacing, radii and
                shadows come from tokens, never hardcoded, so light and dark work for free.
              </Bullet>
              <Bullet>
                Keep components generic and reusable; screen-specific composition lives elsewhere.
              </Bullet>
              <Bullet>
                Every component ships with <code>*.stories.tsx</code>, verifiable in light and dark.
              </Bullet>
            </Stack>
          </Stack>

          <Divider />

          {/* Footer */}
          <Typography variant={'caption'} color={'text.secondary'}>
            See the <strong>design/Theme</strong> stories for the MUI theme foundations — palette,
            typography, elevation, shape and spacing.
          </Typography>
        </Stack>
      </Card>
    </Box>
  ),
};
