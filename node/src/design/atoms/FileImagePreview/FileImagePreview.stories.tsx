import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {FileImagePreview} from './FileImagePreview';

/** Stable placeholder image (needs network to load). */
const SAMPLE_SRC = 'https://picsum.photos/seed/habarico-file/80/96';

const meta: Meta<typeof FileImagePreview> = {
  title: 'design/atoms/FileImagePreview',
  component: FileImagePreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "A file-row thumbnail showing the file's actual image — a 40×48 rounded, cover-fitted " +
          '`<img>`. The image sibling of `FileTypePreview` (the non-image fallback tile); `FileRow` ' +
          '(upload area) renders this one when a preview URL is available. The sample image loads ' +
          'from picsum.photos, so the preview needs network access.',
      },
    },
    controls: {include: ['src', 'alt']},
  },
  argTypes: {src: {control: 'text'}, alt: {control: 'text'}},
  args: {src: SAMPLE_SRC, alt: 'photo.png'},
  decorators: [padDecorator],
};

export default meta;
type Story = StoryObj<typeof FileImagePreview>;

/** Interactive instance — point `src` at an image URL. */
export const Playground: Story = {};

/** A `src` that fails to load falls back to a centered broken-image icon instead of alt text. */
export const BrokenImage: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {src: 'https://example.invalid/missing.png'},
};
