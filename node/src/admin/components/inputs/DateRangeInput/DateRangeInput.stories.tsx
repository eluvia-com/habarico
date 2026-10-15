import type {Meta, StoryObj} from '@storybook/react-vite';
import {withInputShell} from '../_storyKit';
import {DateRangeInput} from './DateRangeInput';

/**
 * Date range input — a read-only text field showing `lower – upper` that opens a custom
 * dual-selection `DateCalendar` popover. Stores `{lower, upper}` as ISO date strings (`null` = open
 * end, displayed as `-∞` / `∞`). The schema layer maps it to the `date` format on a range field.
 */
const meta = {
  title: 'admin/inputs/DateRangeInput',
  component: DateRangeInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['label', 'helperText']},
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
  },
  // `locales` is pinned so the story is deterministic and doesn't depend on `navigator.language`.
  args: {source: 'period', label: 'Period', locales: 'en-GB'},
  decorators: [withInputShell],
} satisfies Meta<typeof DateRangeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Seeded with a closed range so the field shows `lower – upper`; click it to open the calendar. */
export const Playground: Story = {
  parameters: {record: {period: {lower: '2026-01-05', upper: '2026-01-20'}}},
};

/** Empty value renders the open-ended range `-∞ – ∞`. */
export const Empty: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
};
