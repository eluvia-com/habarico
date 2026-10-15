import React from 'react';
// Loads the MUI theme module augmentations (theme.customShadows, theme.radius,
// background.neutral, …) into this file's program — story files are excluded
// from tsconfig, so the augmentations aren't picked up transitively otherwise.
import type {} from '@design/theme/core';
import {Box, Card, Chip, Divider, Stack, Typography, useTheme} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';

/**
 * Documentation page for the `src/admin/` layer — explains its purpose (React Admin restyled into
 * our design system) and where it sits in the library's layered architecture
 * (foundation → design → admin → schema). The layer's live screens are in the sibling
 * `admin/pages/*` stories. Styled to match `design/Welcome`; theme-aware for light and dark.
 */
const meta: Meta = {
  title: 'admin/Welcome',
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
      'React Admin restyled into our design: generic, resource-aware widgets (fields, inputs, buttons, datagrid, views, auth). Data-aware, but schema-agnostic.',
    highlight: true,
  },
  {
    name: 'design',
    blurb:
      'Pure presentation, ZERO backend/API. Panels, hero, list & filters, dialogs, layout shells, common primitives.',
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
        Dependencies flow strictly downward — <code>admin</code> may import <code>design</code>,{' '}
        <code>@design/theme</code> and <code>foundation</code> (and <code>react-admin</code>), never{' '}
        <code>schema</code>.
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
            <Chip label={'src/admin'} size={'small'} color={'primary'} variant={'outlined'} />
            <Typography variant={'h3'} sx={{mt: 2}}>
              Admin layer
            </Typography>
            <Typography variant={'body1'} color={'text.secondary'} sx={{mt: 1.5}}>
              <strong>React Admin restyled into our design system.</strong> This layer binds{' '}
              <code>react-admin</code> (data provider, resources, list/show/edit views, fields,
              inputs, buttons, datagrid, auth) to the presentational <code>@design</code> layer. It
              is <strong>resource-aware</strong> — it knows about React Admin records and CRUD — but{' '}
              <strong>schema-agnostic</strong>: nothing here reads a Habarico schema. Turning a
              schema into an admin UI is the job of the <code>schema</code> layer, built on top of
              this one.
            </Typography>
          </Box>

          <Divider />

          {/* Architecture */}
          <Stack spacing={2}>
            <SectionTitle>Where it sits</SectionTitle>
            <Typography variant={'body2'} color={'text.secondary'}>
              The library is split into four architectural layers with one-way dependencies.{' '}
              <code>admin</code> is the React Admin binding, skinned by <code>design</code>.
            </Typography>
            <LayerStack />
          </Stack>

          <Divider />

          {/* Acceptance test */}
          <Stack spacing={2}>
            <SectionTitle>How we know it is right</SectionTitle>
            <Typography variant={'body2'} color={'text.secondary'}>
              The layer is correct precisely when you can build a working React Admin app out of{' '}
              <code>admin + design + foundation</code> alone — with no schema layer — and it looks
              like our design. That test is exercised live in the <strong>admin/pages</strong>{' '}
              stories: each stands up a real <code>&lt;Admin&gt;</code> (an in-memory{' '}
              <code>ra-data-fakerest</code> data provider + the design theme) and renders a screen
              from React Admin + our skin,{' '}
              <strong>
                with no <code>Schema*</code> component
              </strong>{' '}
              — the admin-layer counterpart of the design-layer <code>design/pages</code> mockups,
              one level up and <em>live</em> instead of static.
            </Typography>
            <Stack spacing={1.25}>
              <Bullet>
                <strong>PropertyList</strong> — a data-backed <code>&lt;List&gt;</code> +{' '}
                <code>&lt;Datagrid&gt;</code> with a search / select filter bar.
              </Bullet>
              <Bullet>
                <strong>PropertyDetail</strong> — a <code>&lt;Show&gt;</code> rendered through the
                design <code>ObjectHero</code> + <code>Panel</code>s.
              </Bullet>
              <Bullet>
                <strong>PropertyEdit</strong> — an <code>&lt;Edit&gt;</code> +{' '}
                <code>&lt;SimpleForm&gt;</code> of themed RA inputs in design panels.
              </Bullet>
              <Bullet>
                <strong>NewOwnerDialog</strong> — a live <code>CreateBase</code> form inside the
                design <code>CustomDialog</code>.
              </Bullet>
              <Bullet>
                <strong>Dashboard</strong> — a design <code>DashboardGrid</code> whose widgets are
                fed by <code>useGetList</code>.
              </Bullet>
            </Stack>
          </Stack>

          <Divider />

          {/* What belongs here */}
          <Stack spacing={2}>
            <SectionTitle>What belongs here</SectionTitle>
            <Stack spacing={1.25}>
              <Bullet>
                React Admin component restyles: <strong>fields</strong>, <strong>inputs</strong>,{' '}
                <strong>buttons</strong>, <strong>datagrid</strong>, <strong>auth</strong> and RA
                overrides (<code>ra-ui-materialui</code> forks).
              </Bullet>
              <Bullet>
                Resource-aware, non-schema plumbing: data hooks (aggregate, call-action, export,
                upload queue), the data provider, and the record / list / upload contexts.
              </Bullet>
              <Bullet>
                A schema-free admin <strong>layout</strong> that wires the design{' '}
                <code>DashboardLayout</code> around the React Admin routed views.
              </Bullet>
            </Stack>
          </Stack>

          <Divider />

          {/* Rules */}
          <Stack spacing={2}>
            <SectionTitle>Rules</SectionTitle>
            <Stack spacing={1.25}>
              <Bullet>
                <strong>
                  No imports from <code>@schema</code>
                </strong>{' '}
                or any schema context — directly or transitively. If a component needs schema
                awareness, it belongs in the layer above.
              </Bullet>
              <Bullet>
                Presentation comes from <code>@design</code> / <code>@design/theme</code> — do not
                rebuild UI primitives here; skin React Admin with the design components and tokens.
              </Bullet>
              <Bullet>
                Keep components generic over the <em>record</em>, not the <em>schema</em> — explicit
                columns / inputs, the React Admin way.
              </Bullet>
              <Bullet>
                <code>@admin</code> is a transitional re-export facade today; it grows as files are
                extracted, so the public import path stays stable.
              </Bullet>
            </Stack>
          </Stack>

          <Divider />

          {/* Footer */}
          <Typography variant={'caption'} color={'text.secondary'}>
            See the <strong>admin/pages</strong> stories for the live screens, and{' '}
            <strong>design/Welcome</strong> for the presentation layer this one is skinned with.
          </Typography>
        </Stack>
      </Card>
    </Box>
  ),
};
