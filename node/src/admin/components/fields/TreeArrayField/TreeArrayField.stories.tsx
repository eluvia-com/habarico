import type {TreeChoice} from '@design/molecules/TreeSelect';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {TreeArrayField, TreeArrayFieldProps} from './TreeArrayField';

// Static hierarchy — the field just reads the selected ids from the record; the schema layer supplies
// these choices (from `useTreeChoices`) in the real app, so the stories need no data provider.
const CHOICES: TreeChoice[] = [
  {id: 'electronics', name: 'Electronics'},
  {id: 'computers', name: 'Computers', parentId: 'electronics'},
  {id: 'laptops', name: 'Laptops', parentId: 'computers'},
  {id: 'desktops', name: 'Desktops', parentId: 'computers'},
  {id: 'phones', name: 'Phones', parentId: 'electronics'},
  {id: 'home', name: 'Home & Garden'},
  {id: 'furniture', name: 'Furniture', parentId: 'home'},
  {id: 'lighting', name: 'Lighting', parentId: 'home'},
];

/**
 * Read-only display for hierarchical `tree-relation` references — a thin binding over the design
 * `TreeSelect`. It reads the checked node ids from the ambient record (`record[source]`) and shows the
 * tree opened to reveal the current value. The `choices` are passed in (the schema layer resolves them
 * through `useTreeChoices`). The read-side counterpart of `TreeArrayInput`.
 */
const meta = {
  title: 'admin/fields/TreeArrayField',
  component: TreeArrayField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {categories: ['laptops', 'phones']},
    controls: {include: ['label']},
  },
  argTypes: {
    label: {control: 'text'},
  },
  args: {
    source: 'categories',
    label: 'Categories',
    choices: CHOICES,
  },
  decorators: [withFieldShell],
} satisfies Meta<TreeArrayFieldProps>;

export default meta;
type Story = StoryObj<TreeArrayFieldProps>;

export const Playground: Story = {};

/** No selected ids — the tree renders with nothing checked. */
export const Empty: Story = {
  parameters: {record: {categories: []}, docs: {canvas: {sourceState: 'none'}}},
};
