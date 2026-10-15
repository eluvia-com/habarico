import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {NumberInput, NumberInputProps} from './NumberInput';

// `numberFormat` is a nested `Intl.NumberFormatOptions` object — the same class of prop as the
// fields' `locales` (a free-text/object Control could hold an invalid combination and throw inside
// `Intl.NumberFormat`, the same failure mode `accept`'s crash was). Instead of widening its Control
// to a corruptible `object`, or inventing a separate "preset" arg, it keeps its real name and gets a
// `select` Control mapped to a real value via `argTypes.numberFormat.mapping`
// (https://storybook.js.org/docs/api/arg-types#mapping) — mirrors `DateField`/`NumberField`'s
// `locales: {control: 'select', options: [...]}` fix.
//
// No `'percent'` preset: `NumberInput`'s adornment logic (`formatToParts`, below) only reads
// through a `'currency'` or `'unit'` part type for the postfix, never `'percentSign'` — the type
// `Intl.NumberFormat({style: 'percent'})` actually produces — so no "%" ever renders. And even with
// that fixed, `Intl`'s percent style multiplies the raw value by 100 (`.format(42)` → `"4,200%"`),
// which `parse`/`format` in the component don't compensate for either. `style: 'percent'` is a real,
// currently non-functional gap in the component, not a Storybook demonstration problem — worth its
// own fix, but out of scope here, so it isn't offered as a preset that would silently do nothing.
const NUMBER_FORMAT_PRESETS = {
  none: undefined,
  currencyEUR: {style: 'currency', currency: 'EUR', maximumFractionDigits: 2},
  unitKg: {style: 'unit', unit: 'kilogram', maximumFractionDigits: 1},
} satisfies Record<string, Intl.NumberFormatOptions | undefined>;

// `numberFormat` is typed `keyof typeof NUMBER_FORMAT_PRESETS` here for the Controls panel, not its
// real `Intl.NumberFormatOptions | undefined` — Storybook resolves the `mapping` before `render`
// ever sees it, so by the time this type is checked against the real
// `NumberInputProps.numberFormat`, the value already is the real one; this override just lets the
// *story* (`args`, the Controls panel) speak the preset key.
type NumberInputStoryArgs = Omit<NumberInputProps, 'numberFormat'> & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
  numberFormat?: keyof typeof NUMBER_FORMAT_PRESETS;
};

/**
 * Number input — a locale-aware numeric `TextInput` with `parse` / `format` (digit grouping,
 * fraction digits, truncation) and optional `prefix` / `postfix` or currency / unit adornments via
 * `numberFormat`. The schema layer maps it to the `integer` / `number` formats.
 */
const meta = {
  title: 'admin/inputs/NumberInput',
  // Cast: `numberFormat` is typed as a preset key above for the Controls panel, but the real
  // component takes `Intl.NumberFormatOptions | undefined` — Storybook maps one to the other at
  // runtime, which `ComponentType<NumberInputStoryArgs>` can't express statically.
  component: NumberInput as React.ComponentType<NumberInputStoryArgs>,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {
      include: ['label', 'helperText', 'size', 'prefix', 'postfix', 'numberFormat', 'error'],
    },
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    prefix: {control: 'text'},
    postfix: {control: 'text'},
    numberFormat: {
      control: {
        type: 'select',
        labels: {none: 'None', currencyEUR: 'Currency (EUR)', unitKg: 'Unit (kg)'},
      },
      options: Object.keys(NUMBER_FORMAT_PRESETS),
      mapping: NUMBER_FORMAT_PRESETS,
      description: 'A named `Intl.NumberFormatOptions` preset.',
    },
    error: {
      control: 'boolean',
      description: 'Show the error state (applies a failing validation).',
    },
  },
  // `locales` is pinned so the stories are deterministic and don't depend on `navigator.language`.
  args: {
    source: 'amount',
    label: 'Amount',
    size: 'small',
    locales: 'en-US',
    numberFormat: 'none',
    error: false,
  },
  decorators: [withInputShell],
} satisfies Meta<NumberInputStoryArgs>;

export default meta;
type Story = StoryObj<NumberInputStoryArgs>;

export const Playground: Story = {
  render: ({error, ...args}) => (
    <NumberInput
      {...(args as unknown as NumberInputProps)}
      validate={error ? failingValidate : undefined}
    />
  ),
};

/** `prefix` / `postfix` render start / end adornments (e.g. a unit). */
export const WithAdornments: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {source: 'weight', label: 'Weight', prefix: '≈', postfix: 'kg'},
};

/** `numberFormat` drives locale formatting — here a EUR currency with 2 decimals. */
export const Currency: Story = {
  parameters: {record: {price: 1234.5}, docs: {canvas: {sourceState: 'none'}}},
  args: {
    source: 'price',
    label: 'Price',
    numberFormat: 'currencyEUR',
  },
};
