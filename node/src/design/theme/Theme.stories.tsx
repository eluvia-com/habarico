import React from 'react';
import {Box, Divider, Paper, Stack, Typography, useTheme} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
// The kit re-exports COLOR_TYPES and loads the MUI theme module augmentations
// (palette shades, customShadows, radius, …) — stories are excluded from tsconfig
// and don't get them otherwise.
import {COLOR_TYPES, Row, Swatch} from '../_storyKit';

/**
 * Living reference for the MUI theme foundations consumed by the design layer:
 * palette, typography, elevation, shape and spacing. Every story reads live from
 * `useTheme()`, so the toolbar light/dark switch shows the real token values in
 * both modes.
 */
const meta: Meta = {
  title: 'design/Theme',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj;

// ----------------------------------------------------------------------
// Shared building blocks
// ----------------------------------------------------------------------

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <Paper sx={{p: 3}}>
    <Typography variant={'h6'}>{title}</Typography>
    {subtitle && (
      <Typography variant={'body2'} color={'text.secondary'} sx={{mb: 2, mt: 0.5}}>
        {subtitle}
      </Typography>
    )}
    {!subtitle && <Box sx={{mb: 2}} />}
    {children}
  </Paper>
);

// ----------------------------------------------------------------------
// Stories
// ----------------------------------------------------------------------

const GREY_KEYS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

export const Palette: Story = {
  render: () => {
    const theme = useTheme();
    return (
      <Stack spacing={3}>
        <Section
          title={'Palette — semantic colors'}
          subtitle={`palette.mode: ${theme.palette.mode}`}
        >
          <Stack spacing={2}>
            {COLOR_TYPES.map((type) => {
              const c = theme.palette[type];
              const shades = [
                {label: 'lighter', value: c.lighter},
                {label: 'light', value: c.light},
                {label: 'main', value: c.main},
                {label: 'dark', value: c.dark},
                {label: 'darker', value: c.darker},
                {label: 'contrastText', value: c.contrastText},
              ];
              return (
                <Box key={type}>
                  <Typography variant={'subtitle2'} sx={{mb: 1, textTransform: 'capitalize'}}>
                    {type}
                  </Typography>
                  <Row>
                    {shades.map((s) => (
                      <Swatch key={s.label} color={s.value} label={s.label} value={s.value} />
                    ))}
                  </Row>
                </Box>
              );
            })}
          </Stack>
        </Section>

        <Section title={'Grey scale'}>
          <Row>
            {GREY_KEYS.map((k) => (
              <Swatch
                key={k}
                color={theme.palette.grey[k]}
                label={`grey.${k}`}
                value={theme.palette.grey[k]}
              />
            ))}
          </Row>
        </Section>

        <Section
          title={'Surfaces, lines & action overlays'}
          subtitle={'Background layers, divider and interaction states — all mode-dependent'}
        >
          <Row>
            <Swatch
              label={'background.default'}
              color={theme.palette.background.default}
              value={theme.palette.background.default}
            />
            <Swatch
              label={'background.paper'}
              color={theme.palette.background.paper}
              value={theme.palette.background.paper}
            />
            <Swatch
              label={'background.neutral'}
              color={theme.palette.background.neutral}
              value={theme.palette.background.neutral}
            />
            <Swatch label={'divider'} color={theme.palette.divider} value={theme.palette.divider} />
            <Swatch
              label={'action.hover'}
              color={theme.palette.action.hover}
              value={theme.palette.action.hover}
            />
            <Swatch
              label={'action.selected'}
              color={theme.palette.action.selected}
              value={theme.palette.action.selected}
            />
            <Swatch
              label={'action.focus'}
              color={theme.palette.action.focus}
              value={theme.palette.action.focus}
            />
          </Row>
          <Stack direction={'row'} spacing={3} sx={{mt: 3}} flexWrap={'wrap'} useFlexGap>
            <Typography color={'text.primary'}>text.primary</Typography>
            <Typography color={'text.secondary'}>text.secondary</Typography>
            <Typography color={'text.disabled'}>text.disabled</Typography>
          </Stack>
        </Section>
      </Stack>
    );
  },
};

const TYPO_VARIANTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'body1',
  'body2',
  'caption',
  'overline',
  'button',
] as const;

export const Typography_: Story = {
  render: () => {
    const theme = useTheme();
    return (
      <Section title={'Typography'} subtitle={'theme.typography.* — Barlow (headings) + DM Sans'}>
        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {TYPO_VARIANTS.map((v) => {
            const t = theme.typography[v];
            return (
              <Box key={v} sx={{display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap'}}>
                <Typography
                  variant={'caption'}
                  color={'text.secondary'}
                  sx={{minWidth: 132, fontFamily: 'monospace'}}
                >
                  {v} · {String(t.fontSize)} / {String(t.fontWeight)}
                </Typography>
                <Typography variant={v}>The quick brown fox</Typography>
              </Box>
            );
          })}
        </Stack>
      </Section>
    );
  },
};

const Z_SHADOWS = ['z1', 'z4', 'z8', 'z12', 'z16', 'z20', 'z24'] as const;
const SEMANTIC_SHADOWS = ['card', 'dropdown', 'dialog'] as const;

// The theme access lives in a nested component so Storybook's `jsxDecorator`
// (which invokes the story's `render` outside the theme provider to serialize
// the "Show code" snippet) doesn't dereference custom theme extensions
// (`customShadows` / `radius`) on the default MUI theme and crash. In the real
// canvas render the component runs inside the provider and reads the values.
const ElevationDemo = () => {
  const theme = useTheme();
  return (
    <Section
      title={'Elevation — customShadows'}
      subtitle={'theme.customShadows.* — elevation ramp plus semantic surface shadows'}
    >
      <Stack direction={'row'} spacing={4} flexWrap={'wrap'} useFlexGap>
        {[...Z_SHADOWS, ...SEMANTIC_SHADOWS].map((k) => (
          <Box key={k} sx={{textAlign: 'center'}}>
            <Box
              sx={{
                width: 96,
                height: 64,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: theme.customShadows[k],
              }}
            />
            <Typography variant={'caption'} display={'block'} sx={{mt: 1}}>
              {k}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Section>
  );
};

export const Elevation: Story = {
  render: () => <ElevationDemo />,
};

const RADIUS_KEYS = ['sm', 'base', 'md', 'lg', 'pill'] as const;

const ShapeDemo = () => {
  const theme = useTheme();
  return (
    <Section
      title={'Shape — radius scale'}
      subtitle={'theme.radius.* — base mirrors shape.borderRadius (lg = root Panel)'}
    >
      <Stack direction={'row'} spacing={4} flexWrap={'wrap'} useFlexGap alignItems={'flex-end'}>
        {RADIUS_KEYS.map((k) => (
          <Box key={k} sx={{textAlign: 'center'}}>
            <Box
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                borderRadius: `${theme.radius[k]}px`,
              }}
            />
            <Typography variant={'caption'} display={'block'} sx={{mt: 1}}>
              {k} · {theme.radius[k]}px
            </Typography>
          </Box>
        ))}
      </Stack>
    </Section>
  );
};

export const Shape: Story = {
  render: () => <ShapeDemo />,
};

const SPACING_STEPS = [1, 2, 3, 4, 5, 6, 8, 10] as const;

export const Spacing: Story = {
  render: () => {
    const theme = useTheme();
    return (
      <Section title={'Spacing'} subtitle={'theme.spacing(n) — 8px base unit'}>
        <Stack spacing={1.5}>
          {SPACING_STEPS.map((n) => (
            <Box key={n} sx={{display: 'flex', alignItems: 'center', gap: 2}}>
              <Typography variant={'caption'} sx={{minWidth: 88, fontFamily: 'monospace'}}>
                spacing({n})
              </Typography>
              <Box
                sx={{
                  height: 16,
                  width: theme.spacing(n),
                  bgcolor: 'primary.main',
                  borderRadius: 0.5,
                }}
              />
              <Typography variant={'caption'} color={'text.secondary'}>
                {theme.spacing(n)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Section>
    );
  },
};
