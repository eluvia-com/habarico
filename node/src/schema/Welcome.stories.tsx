import React from 'react';
// Loads the MUI theme module augmentations (theme.customShadows, theme.radius,
// background.neutral, …) into this file's program — story files are excluded
// from tsconfig, so the augmentations aren't picked up transitively otherwise.
import type {} from '@design/theme/core';
import {Box, Card, Chip, Divider, Stack, Typography, useTheme} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';

/**
 * Documentation page for the `src/schema/` layer — explains its purpose (turn a Habarico schema into
 * a complete admin UI) and where it sits in the library's layered architecture
 * (foundation → design → admin → schema). The layer's live screens are in the sibling
 * `schema/pages/*` stories. Styled to match `admin/Welcome` / `design/Welcome`; theme-aware for
 * light and dark.
 */
const meta: Meta = {
  title: 'schema/Welcome',
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
    highlight: true,
  },
  {
    name: 'admin',
    blurb:
      'React Admin restyled into our design: generic, resource-aware widgets (fields, inputs, buttons, datagrid, views, auth). Data-aware, but schema-agnostic.',
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
        Dependencies flow strictly downward — <code>schema</code> is the top layer: it may import{' '}
        <code>admin</code>, <code>design</code>, <code>@design/theme</code> and{' '}
        <code>foundation</code>, and nothing imports it back.
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
            <Chip label={'src/schema'} size={'small'} color={'primary'} variant={'outlined'} />
            <Typography variant={'h3'} sx={{mt: 2}}>
              Schema layer
            </Typography>
            <Typography variant={'body1'} color={'text.secondary'} sx={{mt: 1.5}}>
              <strong>The schema-driven core of habarico.</strong> Its input is a Habarico schema (a{' '}
              <code>ServiceSchema</code> plus per-resource <code>LocalResourceSchema</code>) and its
              output is a whole admin UI — menu, list / show / edit / create / action views, fields,
              inputs, boxes and actions — <strong>generated</strong>, not hand-written. Where{' '}
              <code>admin</code> gives you resource-aware widgets you wire up by hand, this layer
              reads the schema and decides <em>which</em> widgets to render and <em>how</em>. It
              sits on top of <code>admin + design + foundation</code>.
            </Typography>
          </Box>

          <Divider />

          {/* Architecture */}
          <Stack spacing={2}>
            <SectionTitle>Where it sits</SectionTitle>
            <Typography variant={'body2'} color={'text.secondary'}>
              The library is split into four architectural layers with one-way dependencies.{' '}
              <code>schema</code> is the topmost, schema-driven layer, built on the one below.
            </Typography>
            <LayerStack />
          </Stack>

          <Divider />

          {/* Acceptance test */}
          <Stack spacing={2}>
            <SectionTitle>How we know it is right</SectionTitle>
            <Typography variant={'body2'} color={'text.secondary'}>
              The layer is correct precisely when a complete admin can be generated from a Habarico
              schema alone — no per-screen code. That test is exercised live in the{' '}
              <strong>schema/pages</strong> stories: each boots a real{' '}
              <code>&lt;SchemaAdmin&gt;</code> wired to a mock <code>SchemaProvider</code> and an
              in-memory <code>ra-data-fakerest</code> data provider, then lets the hand-authored
              mock schema generate the entire UI —{' '}
              <strong>no live backend, no hand-built views</strong>. The schema-layer counterpart of
              the <code>admin/pages</code> screens, one level up and driven by a schema instead of
              explicit <code>&lt;Resource&gt;</code> / view components.
            </Typography>
            <Stack spacing={1.25}>
              <Bullet>
                <strong>PropertyList / OwnerList / DocumentList / PaymentList</strong> —
                schema-driven lists: columns, filters, sorting and relations all come from each
                resource&apos;s <code>list</code> view schema.
              </Bullet>
              <Bullet>
                <strong>PropertyDetail</strong> — a <code>show</code> view whose boxes come from the
                schema: a <strong>tab</strong> box over a <strong>grid</strong> of gallery / simple
                / array boxes, plus a related-records <strong>list</strong> box.
              </Bullet>
              <Bullet>
                <strong>PropertyEdit / OwnerEdit</strong> — the same detail boxes rendered as a form
                of schema-picked inputs.
              </Bullet>
              <Bullet>
                <strong>PropertyCreate / OwnerCreate</strong> — an empty form generated from the{' '}
                <code>create</code> view&apos;s <code>post</code> fields.
              </Bullet>
              <Bullet>
                <strong>Report an issue</strong> — a custom <code>action</code> view reached from
                the <strong>PropertyDetail</strong> toolbar (the button between <em>Upravit</em> and{' '}
                <em>Smazat</em>), opened in a dialog over the detail.
              </Bullet>
            </Stack>
            <Typography variant={'caption'} color={'text.secondary'}>
              The left menu itself is generated too — from each resource&apos;s <code>menu</code>{' '}
              entry, not passed in by hand.
            </Typography>
          </Stack>

          <Divider />

          {/* What belongs here */}
          <Stack spacing={2}>
            <SectionTitle>What belongs here</SectionTitle>
            <Stack spacing={1.25}>
              <Bullet>
                The schema entry points and app shell: <strong>SchemaAdmin</strong>,{' '}
                <strong>SchemaResource</strong>, <strong>SchemaLayout</strong>,{' '}
                <strong>SchemaMenu</strong>, <strong>SchemaSearch</strong>.
              </Bullet>
              <Bullet>
                Schema-driven views (<strong>SchemaList / Show / Create / Edit / Action</strong>)
                and the <strong>box</strong> system (tab, grid, array, list, object, gallery) that
                maps a box schema to a layout.
              </Bullet>
              <Bullet>
                Schema-keyed <strong>fields</strong> and <strong>inputs</strong> (chosen by{' '}
                <code>FieldType</code> + <code>FieldFormatType</code>), the{' '}
                <strong>dashboard</strong> &amp; pluggable <strong>widgets</strong>, and the{' '}
                <code>SchemaProvider</code> / <code>DataProvider</code> plumbing.
              </Bullet>
            </Stack>
          </Stack>

          <Divider />

          {/* Rules */}
          <Stack spacing={2}>
            <SectionTitle>Rules</SectionTitle>
            <Stack spacing={1.25}>
              <Bullet>
                The <strong>schema is the source of truth</strong> — components read fields, views,
                boxes and actions from it and stay generic over <em>any</em> resource, never
                hard-coding a screen.
              </Bullet>
              <Bullet>
                Reuse the layers below: resource-aware widgets from <code>@admin</code>,
                presentation from <code>@design</code> / <code>@design/theme</code> — do not rebuild
                them here.
              </Bullet>
              <Bullet>
                Customization goes through the pluggable providers (field / input / box / button /
                view / widget) — a consumer provider is consulted first, the{' '}
                <code>default*Provider</code> is the fallback.
              </Bullet>
              <Bullet>
                Newer schema types belong in <code>@schema</code> (<code>src/schema/types.ts</code>
                ), not the top-level <code>src/types.ts</code>.
              </Bullet>
            </Stack>
          </Stack>

          <Divider />

          {/* Footer */}
          <Typography variant={'caption'} color={'text.secondary'}>
            See the <strong>schema/pages</strong> stories for the live schema-generated screens, and{' '}
            <strong>admin/Welcome</strong> for the resource-aware layer this one is built on.
          </Typography>
        </Stack>
      </Card>
    </Box>
  ),
};
