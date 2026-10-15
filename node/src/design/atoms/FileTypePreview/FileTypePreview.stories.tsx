import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {VariantGrid, padDecorator} from '../../_storyKit';
import {FileTypePreview} from './FileTypePreview';

const meta: Meta<typeof FileTypePreview> = {
  title: 'design/atoms/FileTypePreview',
  component: FileTypePreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A file-row thumbnail placeholder for **non-image** files — a coloured 40×48 tile showing ' +
          "the file's uppercase extension, with the accent colour keyed off that extension. The " +
          'non-image sibling of `FileImagePreview`; `FileRow` (upload area) picks between the two ' +
          'depending on whether a preview image is available.',
      },
    },
    controls: {include: ['filename']},
  },
  argTypes: {filename: {control: 'text'}},
  args: {filename: 'contract.pdf'},
  decorators: [padDecorator],
};

export default meta;
type Story = StoryObj<typeof FileTypePreview>;

/** Interactive instance — type a filename to see its extension tile and colour. */
export const Playground: Story = {};

const SAMPLES = [
  'report.pdf',
  'sheet.xlsx',
  'notes.docx',
  'slides.pptx',
  'archive.zip',
  'audio.mp3',
  'photo.png',
  'file.unknown',
];

/** The colour mapping across common extensions, plus the neutral fallback for unknown types. */
export const Types: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      align={'flex-start'}
      items={SAMPLES}
      keyOf={(f) => f}
      label={(f) => f}
      render={(f) => <FileTypePreview filename={f} />}
    />
  ),
};
