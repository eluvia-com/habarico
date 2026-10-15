import React, {useState} from 'react';
import {Paper} from '@mui/material';
import {type Decorator, Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {UploadArea} from './UploadArea';
import {UploadFileItem} from './types';

// Places the area on an opaque `Paper` (like FormTable's stories) so the neutral file rows read
// against the surface, in a form-column-width frame.
const onPaper: Decorator = (Story) => (
  <Paper sx={{p: 2, maxWidth: 720}}>
    <Story />
  </Paper>
);

// Static items covering every visual state the row can render.
const IDLE: UploadFileItem = {
  id: 'idle',
  filename: 'contract.pdf',
  fileSize: 248_000,
  progress: null,
};
const UPLOADING: UploadFileItem = {
  id: 'uploading',
  filename: 'presentation.pptx',
  fileSize: 4_200_000,
  progress: 62,
};
const DONE: UploadFileItem = {
  id: 'done',
  filename: 'photo.png',
  fileSize: 180_000,
  previewUrl: 'https://picsum.photos/seed/hab-upload/80/96',
  progress: null,
  uploaded: true,
};
const DONE_2: UploadFileItem = {
  id: 'done2',
  filename: 'photo2.png',
  fileSize: 180_000,
  previewUrl: 'https://picsum.photos/seed/hab-upload/80/96',
  progress: null,
  uploaded: true,
};
const ERROR: UploadFileItem = {
  id: 'error',
  filename: 'archive.zip',
  fileSize: 12_000_000,
  progress: null,
  error: 'An error occurred during upload.',
};

const meta: Meta<typeof UploadArea> = {
  title: 'design/organisms/UploadArea',
  component: UploadArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A fully controlled, presentational upload UI — a click/drag drop zone plus a list of ' +
          'file rows, each rendering its own state (idle, uploading with a progress bar, complete, ' +
          'or error with a retry action). Purely presentational: it owns no upload logic and holds ' +
          'no queue — pass `items` (an `UploadFileItem[]` view-model) and handle `onAddFiles` / ' +
          '`onRemoveItem` / `onRetryItem` / `onRemoveAll`. It is i18n-agnostic: all strings come ' +
          'from the optional `labels` prop (EN defaults via `DEFAULT_UPLOAD_AREA_LABELS`), so it ' +
          'renders with no React Admin or schema context.',
      },
    },
    controls: {
      include: ['accept', 'maxFiles', 'maxFileSize', 'disabled', 'noBorder', 'density'],
    },
  },
  argTypes: {
    maxFiles: {control: 'number'},
    maxFileSize: {control: 'number'},
    disabled: {control: 'boolean'},
    noBorder: {control: 'boolean'},
    density: {control: 'inline-radio', options: ['compact', 'standard', 'comfortable']},
  },
  args: {
    accept: ['.png', '.jpg', '.pdf'],
    maxFileSize: 5_000_000,
    disabled: false,
    noBorder: false,
    density: 'standard',
  },
  decorators: [padDecorator, onPaper],
};

export default meta;

type Story = StoryObj<typeof UploadArea>;

// Hooks live in a top-level demo component (never inside a `render` arrow) so Storybook's
// "Show code" serializer never re-invokes them outside the theme provider.
const InteractiveDemo = (args: React.ComponentProps<typeof UploadArea>) => {
  const [items, setItems] = useState<UploadFileItem[]>([DONE, DONE_2]);
  const addFiles = (files: File[]) =>
    setItems((prev) => [
      ...prev,
      ...files.map((f) => ({
        id: `${f.name}-${prev.length}`,
        filename: f.name,
        fileSize: f.size,
        progress: null,
      })),
    ]);
  return (
    <UploadArea
      {...args}
      items={items}
      onAddFiles={addFiles}
      onRemoveItem={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
      onRemoveAll={() => setItems([])}
    />
  );
};

// `render` returns the local `InteractiveDemo` helper (it owns the file-list state — see the
// "Hooks live in a top-level demo component" rule), so "Show code" would otherwise show that
// helper's tag, so `docs.source.transform` below rebuilds the real usage from the story's
// *current* args instead — reactive, unlike a static `docs.source.code` override.
const buildPlaygroundSource = (args: React.ComponentProps<typeof UploadArea>) => `<UploadArea
  items={items}
  onAddFiles={addFiles}
  onRemoveItem={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
  onRemoveAll={() => setItems([])}
  accept={${JSON.stringify(args.accept)}}
  maxFileSize={${args.maxFileSize}}
  disabled={${args.disabled}}
  noBorder={${args.noBorder}}
  density=${JSON.stringify(args.density)}
/>`;

/** Interactive instance — pick or drop files to append rows, remove them individually or all at once. */
export const Playground: Story = {
  render: (args) => <InteractiveDemo {...args} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: React.ComponentProps<typeof UploadArea>}) =>
          buildPlaygroundSource(args),
      },
    },
  },
};

/** Every row state at once: idle, uploading, complete and error (with retry). */
export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <UploadArea
      items={[IDLE, UPLOADING, DONE, ERROR]}
      onAddFiles={() => {}}
      onRemoveItem={() => {}}
      onRetryItem={() => {}}
      onRemoveAll={() => {}}
      accept={['.png', '.jpg', '.pdf', '.zip']}
      maxFileSize={5_000_000}
    />
  ),
};

/** Single-file mode — the drop zone hides once the one allowed file is present. */
export const SingleFile: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <UploadArea items={[DONE]} onAddFiles={() => {}} onRemoveItem={() => {}} maxFiles={1} />
  ),
};

/** Borderless — how the field embeds inside the form-bound `UploadInput` fieldset. */
export const NoBorder: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <UploadArea items={[IDLE]} onAddFiles={() => {}} onRemoveItem={() => {}} noBorder />
  ),
};
