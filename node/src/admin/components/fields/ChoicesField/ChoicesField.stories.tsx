import type {Choices} from '@admin/utils/choices';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {ChoicesField, ChoicesFieldProps} from './ChoicesField';

// The enum the field maps the stored value against — the schema layer supplies this from the field
// schema in the real app, so the stories pass it inline.
const STATUS_CHOICES: Choices = [
  {value: 'draft', label: 'Draft'},
  {value: 'active', label: 'Active', color: 'success'},
  {value: 'paused', label: 'Paused', color: 'warning'},
  {value: 'archived', label: 'Archived', color: 'error'},
];

// A colorless enum — the only kind `variant: 'text'` actually renders as text, since a color is
// information plain text cannot carry.
const PLAIN_CHOICES: Choices = [
  {value: 'draft', label: 'Draft'},
  {value: 'active', label: 'Active'},
  {value: 'paused', label: 'Paused'},
];

// Same enum with an icon per value — when every entry carries an icon the field renders an `EnumChip`.
const STATUS_CHOICES_WITH_ICONS: Choices = [
  {value: 'draft', label: 'Draft', icon: 'EditNote'},
  {value: 'active', label: 'Active', color: 'success', icon: 'CheckCircle'},
  {value: 'paused', label: 'Paused', color: 'warning', icon: 'PauseCircle'},
  {value: 'archived', label: 'Archived', color: 'error', icon: 'Inventory2'},
];

/**
 * Read-only display for `choices` values — resolves the stored value against the enum and renders the
 * matching option as a colored `Chip`. When every option defines an `icon`, it renders an `EnumChip`
 * (icon + label) instead. The read-side counterpart of `ChoicesInput`.
 *
 * `variant: 'text'` renders the label as plain text — but only for an enum whose options define no
 * color of their own. A colored enum keeps its chips, because the color is information the text
 * cannot carry; the rule is evaluated over the whole option list, so one field never mixes the two.
 */
const meta = {
  title: 'admin/fields/ChoicesField',
  component: ChoicesField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {status: 'active'},
    // `variant` is deliberately not a control here: the Playground's enum is colored, where the
    // chips stay whichever shape is asked for, so the control would change nothing on screen. The
    // two showcases below demonstrate both sides of that rule instead.
    controls: {include: ['label']},
  },
  argTypes: {
    label: {control: 'text'},
  },
  args: {
    source: 'status',
    label: 'Status',
    choices: STATUS_CHOICES,
  },
  decorators: [withFieldShell],
} satisfies Meta<ChoicesFieldProps>;

export default meta;
type Story = StoryObj<ChoicesFieldProps>;

export const Playground: Story = {};

/**
 * `variant: 'text'` on a colorless enum — the label is rendered as plain text. Switch `choices` to a
 * colored enum and the same `variant` keeps the chips.
 */
export const AsText: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {choices: PLAIN_CHOICES, variant: 'text'},
};

/** `variant: 'text'` on a *colored* enum — the chips stay, because the color carries meaning. */
export const AsTextWithColoredEnum: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {variant: 'text'},
};

/** Every option carries an icon, so the value renders as an icon + label `EnumChip`. */
export const WithIcons: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {choices: STATUS_CHOICES_WITH_ICONS},
};

/** The stored value has no matching option — the field shows the `emptyText`. */
export const Empty: Story = {
  parameters: {record: {status: null}, docs: {canvas: {sourceState: 'none'}}},
  args: {emptyText: '—'},
};
