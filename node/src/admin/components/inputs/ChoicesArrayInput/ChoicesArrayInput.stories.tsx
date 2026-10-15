import React from 'react';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {ChoicesArrayInput, ChoicesArrayInputProps} from './ChoicesArrayInput';

// `iconsKey` is a real `string` prop, but its Control is a `boolean` switch mapped to the one demo
// key via `argTypes.iconsKey.mapping` (https://storybook.js.org/docs/api/arg-types#mapping) — the
// argType key itself stays `iconsKey`, so the Controls panel names the actual prop, not an invented
// one. Storybook resolves the mapping before `render` ever sees it, so by the time this type is
// checked against the real `ChoicesArrayInputProps.iconsKey: string | undefined`, the value already
// is a string — this local override just lets the *story* (`args`, the Controls panel) speak
// `boolean`.
type ChoicesArrayInputStoryArgs = Omit<ChoicesArrayInputProps, 'iconsKey'> & {
  iconsKey?: boolean;
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

const CHOICES = [
  {value: 'draft', label: 'Draft'},
  {value: 'active', label: 'Active', color: 'success' as const},
  {value: 'archived', label: 'Archived', color: 'warning' as const},
];

// The icon set itself is app-level config (`AdminConfig.iconsMap`), registered once on the admin
// root — a Control can't hold React elements, so it's kept fixed here and only switched on/off via
// `iconsKey`. Prepended to "Show code" (see `Playground`'s `docs.source.transform`) whenever icons
// are on, so the switch also teaches the wiring "Show code" can otherwise never reveal: it only
// ever serializes what `render` returns, never the config that makes `iconsKey` resolve.
const ICONS_SETUP_SNIPPET = `// \`iconsKey\` names an icon set registered once, app-wide, on the admin root:
//
// <SchemaAdmin
//   iconsMap={{
//     status: {
//       draft: <EditIcon />,
//       active: <CheckCircleIcon />,
//       archived: <ArchiveIcon />,
//     },
//   }}
//   ...
// />
`;

/**
 * Multi-value choices input — a `SelectArrayInput` driven by an enum, used by the schema layer
 * (`SchemaArrayInput`) for an `array` of `choices`. Selected values render as coloured `soft`
 * chips; per-option leading icons come from the admin icon registry (`AdminConfig.iconsMap` / `useIcons`),
 * named by `iconsKey`. Stories render inside a fixed-width card so `fullWidth` is
 * visible.
 */
const meta = {
  title: 'admin/inputs/ChoicesArrayInput',
  // Cast: `iconsKey` is typed `boolean` above for the Controls panel (see
  // `ChoicesArrayInputStoryArgs`), but the real component takes `string | undefined` — Storybook
  // maps one to the other at runtime, which `ComponentType<ChoicesArrayInputStoryArgs>` can't
  // express statically.
  component: ChoicesArrayInput as React.ComponentType<ChoicesArrayInputStoryArgs>,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {
      include: ['label', 'helperText', 'size', 'fullWidth', 'disabled', 'iconsKey', 'error'],
    },
    record: {tags: ['active', 'draft']},
    // Backs the demo `status` key `iconsKey`'s mapping resolves to — see `ICONS_SETUP_SNIPPET`.
    icons: {
      status: {
        draft: <EditIcon fontSize="small" sx={{mr: 0.5}} />,
        active: <CheckCircleIcon fontSize="small" color="success" sx={{mr: 0.5}} />,
        archived: <ArchiveIcon fontSize="small" color="disabled" sx={{mr: 0.5}} />,
      },
    },
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    fullWidth: {control: 'boolean'},
    disabled: {control: 'boolean'},
    iconsKey: {
      control: 'boolean',
      mapping: {true: 'status', false: undefined},
      description: 'Switches the demo `status` icon set (`AdminConfig.iconsMap`) on/off.',
    },
    error: {
      control: 'boolean',
      description: 'Show the error state (applies a failing validation).',
    },
  },
  args: {
    source: 'tags',
    label: 'Tags',
    choices: CHOICES,
    size: 'small',
    fullWidth: true,
    iconsKey: false,
    error: false,
  },
  decorators: [withInputShell],
} satisfies Meta<ChoicesArrayInputStoryArgs>;

export default meta;
type Story = StoryObj<ChoicesArrayInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <ChoicesArrayInput
      {...(args as unknown as ChoicesArrayInputProps)}
      validate={error ? failingValidate : undefined}
    />
  ),
  parameters: {
    docs: {
      source: {
        // Idempotent by construction (strip, then re-add at most once) rather than a plain prepend:
        // addon-docs can invoke `transform` more than once per render for the same story, and a
        // plain `${SNIPPET}\n${code}` would then stack the comment block every time it re-runs.
        transform: (code: string, {args}: {args: ChoicesArrayInputStoryArgs}) => {
          const withoutSnippet = code.split(ICONS_SETUP_SNIPPET).join('').replace(/^\n+/, '');
          return args.iconsKey ? `${ICONS_SETUP_SNIPPET}\n${withoutSnippet}` : withoutSnippet;
        },
      },
    },
  },
};

/** Choice icons rendered on. Kept as a plain, non-interactive Showcase — `Playground`'s `iconsKey`
 * switch (with "Show code" attached to it) is where a reader learns the wiring. */
export const WithIcons: Story = {
  args: {iconsKey: true},
  parameters: {docs: {canvas: {sourceState: 'none'}}},
};
