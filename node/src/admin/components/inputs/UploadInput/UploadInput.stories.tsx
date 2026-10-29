import React, {useState} from 'react';
import {useWatch} from 'react-hook-form';
import {expect, fireEvent, waitFor, within} from 'storybook/test';
import type {UploadTransportConfig} from '@foundation/utils/upload';
import {Box, Stack, Typography} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {failingValidate, withInputShell} from '../_storyKit';
import {UploadInput, UploadInputProps} from './UploadInput';
import type {FileData} from './types';

type UploadInputStoryArgs = UploadInputProps & {
  /** Story-only: applies a failing validation so the error state renders. */
  error?: boolean;
};

/**
 * Upload input — a form-bound file field. It wraps the design `UploadArea` in a labelled fieldset,
 * owns the upload queue (`useUploadQueue`), registers in-flight uploads with the `UploadingContext`
 * (so `SaveButton` waits for them) and maps between the React Admin form value (`FileData` /
 * `FileData[]`) and the queue. Schema-agnostic: `defaultInputProvider` reads the field options and
 * feeds it explicit props. All strings come from `ra.upload_files.*`
 * translations; the light/dark toolbar toggle applies via the design theme.
 *
 * `resizeWidth` / `cropAspectRatio` are real props (see `useFileModifier`) but aren't exposed here
 * as Controls: the row thumbnail (`FileImagePreview`) is a fixed 40×48 `object-fit: cover` tile, so
 * neither a resize nor a crop ever changes what's on screen — only the stored bytes/dimensions,
 * which nothing in this Playground reads out. The dedicated stories below (`ImageResize` and its
 * siblings) prove the actual effect via a `StoredValue` readout instead of the canvas.
 */
const meta = {
  title: 'admin/inputs/UploadInput',
  component: UploadInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {
      include: [
        'label',
        'helperText',
        'readOnly',
        'maxFiles',
        'maxFileSize',
        'accept',
        'showImagePreview',
        'fullWidth',
        'error',
      ],
    },
  },
  argTypes: {
    label: {control: 'text'},
    helperText: {control: 'text'},
    readOnly: {control: 'boolean'},
    maxFiles: {control: 'number'},
    maxFileSize: {control: 'number'},
    accept: {control: 'object'},
    showImagePreview: {control: 'boolean'},
    fullWidth: {control: 'boolean'},
    error: {
      control: 'boolean',
      description: 'Show the error state (applies a failing validation).',
    },
  },
  args: {
    source: 'attachments',
    label: 'Attachments',
    // A real array, not `undefined`: Storybook's generic `object` control infers whether to render
    // an array or key/value editor from the *current* value's shape. Starting from `undefined`, its
    // "add" button builds a plain `{}` instead of a list item — `UploadArea`'s `accept?.join(',')`
    // (and `formatAccept`'s `.length`/`.map`) then throws on that non-array, crashing the story.
    accept: ['.png', '.jpg', '.pdf'],
    showImagePreview: false,
    fullWidth: true,
    error: false,
  },
  decorators: [withInputShell],
} satisfies Meta<UploadInputStoryArgs>;

export default meta;
type Story = StoryObj<UploadInputStoryArgs>;

/** Interactive instance — pick or drop files; base64 uploads resolve against the story data provider. */
export const Playground: Story = {
  render: ({error, ...args}) => (
    <UploadInput {...(args as UploadInputProps)} validate={error ? failingValidate : undefined} />
  ),
};

/** Single-file mode — the drop zone hides once one file is present. */
export const SingleFile: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {source: 'avatar', label: 'Avatar', maxFiles: 1, showImagePreview: true},
};

/** Pre-populated from the record — backend-loaded files render without a status badge. */
export const WithExistingFiles: Story = {
  parameters: {
    record: {
      attachments: [
        {filename: 'contract.pdf', url: ''},
        {filename: 'notes.txt', url: ''},
      ],
    },
    docs: {canvas: {sourceState: 'none'}},
  },
};

/** Read-only — the drop zone and delete actions are disabled. */
export const ReadOnly: Story = {
  args: {readOnly: true},
  parameters: {
    record: {attachments: [{filename: 'contract.pdf', url: ''}]},
    docs: {canvas: {sourceState: 'none'}},
  },
};

// ---------------------------------------------------------------------------
// Resize/crop applies to every upload path, and validation (including the
// size-based choice between the inline and chunked path) judges the file that
// actually gets stored, not the one that was picked. The stories below make
// that observable without a backend: no chunked transport is registered in the
// free package, so a file routed to the chunked path fails loudly instead of
// silently succeeding.
// ---------------------------------------------------------------------------

/** Encoded payload length → the byte size the field will actually submit. */
const base64Bytes = (content: string) => Math.round((content.length * 3) / 4);

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
};

/**
 * Rebuilds a displayable source from the stored value. The field value carries `content` (the raw
 * base64) but not the Data URI - `useUploadQueue` peels `url` off for the row preview - so the mime
 * prefix is restored from the filename the transform produced.
 */
const storedSrc = (stored?: FileData): string | undefined => {
  if (!stored?.content || !stored.filename) return undefined;
  const type = MIME_BY_EXT[stored.filename.split('.').pop()?.toLowerCase() ?? ''];
  return type ? `data:${type};base64,${stored.content}` : undefined;
};

/** Which upload path produced the value currently in the field. */
const storedShape = (stored?: FileData & {upload_key?: string}) => {
  if (stored?.upload_key) return 'chunked';
  return stored?.content ? 'base64' : 'empty';
};

/**
 * Story-only readout of what the field currently holds. `content` means the file was inlined as
 * base64 and rides along with the form submit; `upload_key` means it was streamed out-of-band by a
 * chunked transport. Which of the two appears is the whole point of these stories.
 */
const StoredValue = ({source}: {source: string}) => {
  const value = useWatch({name: source}) as FileData | FileData[] | undefined;
  const [dimensions, setDimensions] = useState<string>();
  const stored = (Array.isArray(value) ? value[0] : value) as
    (FileData & {upload_key?: string}) | undefined;

  const shape = storedShape(stored);

  return (
    <Box sx={{mt: 3, p: 2, borderRadius: 1, bgcolor: 'action.hover'}}>
      <Typography variant="overline" color="text.secondary">
        Stored value
      </Typography>
      {shape === 'empty' ? (
        <Typography variant="body2">Nothing stored yet — pick or drop a file.</Typography>
      ) : (
        <Stack spacing={0.5}>
          <Typography variant="body2">
            path: <strong data-testid="stored-shape">{shape}</strong>
            {shape === 'chunked' ? ' (streamed out-of-band)' : ' (inlined in the form submit)'}
          </Typography>
          <Typography variant="body2">filename: {stored?.filename ?? '—'}</Typography>
          {stored?.content && (
            <Typography variant="body2" data-testid="stored-bytes">
              stored size: {base64Bytes(stored.content).toLocaleString()} B
            </Typography>
          )}
          {storedSrc(stored) && (
            <>
              <Typography variant="body2" data-testid="stored-dimensions">
                dimensions: {dimensions ?? 'measuring…'}
              </Typography>
              <Box
                component="img"
                src={storedSrc(stored)}
                alt=""
                onLoad={(e: React.SyntheticEvent<HTMLImageElement>) =>
                  setDimensions(`${e.currentTarget.naturalWidth}×${e.currentTarget.naturalHeight}`)
                }
                sx={{display: 'none'}}
              />
            </>
          )}
        </Stack>
      )}
    </Box>
  );
};

const WithReadout = (args: UploadInputProps) => (
  <>
    <UploadInput {...args} />
    <StoredValue source={args.source} />
  </>
);

const IMAGE_ACCEPT = ['.png', '.jpg', '.jpeg'];

/** A transport whose threshold a raw photo clears easily but a 200px resize does not. */
const TRANSPORT: UploadTransportConfig = {
  provider: 's3-multipart',
  threshold: 200_000,
  chunkSize: 5_242_880,
  initiateUrl: 'https://example.invalid/uploads/initiate/?model=demo.photo&field=image',
};

/** Builds an incompressible PNG, so its byte size is driven by the pixel count. */
const makeNoisyPng = async (width: number, height: number, name = 'photo.png'): Promise<File> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const image = ctx.createImageData(width, height);
  // `getRandomValues` caps each call at 64 KiB, so fill the buffer in chunks, then force every
  // alpha byte opaque - a random alpha channel would let the encoder compress the noise away.
  for (let offset = 0; offset < image.data.length; offset += 65_536) {
    crypto.getRandomValues(image.data.subarray(offset, offset + 65_536));
  }
  for (let i = 3; i < image.data.length; i += 4) image.data[i] = 255;
  ctx.putImageData(image, 0, 0);
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), 'image/png')
  );
  return new File([blob], name, {type: 'image/png'});
};

/** Puts a file into the field the way a drag-and-drop does — bypassing the picker's `accept`. */
const dropFile = (canvasElement: HTMLElement, file: File) => {
  const input = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  fireEvent.change(input);
};

/**
 * Resize on the ordinary inline path. Drop a photo of any size — the stored value is 200px wide,
 * and its byte size is a fraction of the file you picked.
 */
export const ImageResize: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    source: 'photo',
    label: 'Photo (resized to 200px)',
    maxFiles: 1,
    showImagePreview: true,
    accept: IMAGE_ACCEPT,
    resizeWidth: 200,
  },
  render: (args) => <WithReadout {...(args as UploadInputProps)} />,
};

/**
 * The size-based inline/chunked choice is judged **after** the resize, not on the file as picked.
 * The transport's threshold is 200 kB — this story's stub doesn't register a chunked transport (the
 * free package ships the inline path only), so anything actually routed to the chunked path fails
 * with "the schema requires a chunked upload, but no transport is registered".
 *
 * Drop a photo larger than 200 kB. It is resized to 200px *first*, which puts it far below the
 * threshold, so it stores inline and the readout says `base64` — the full-resolution original is
 * never what gets stored or submitted.
 */
export const ResizeDecidesTheUploadPath: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    source: 'photo',
    label: 'Photo (200px, chunked above 200 kB)',
    maxFiles: 1,
    showImagePreview: true,
    accept: IMAGE_ACCEPT,
    resizeWidth: 200,
    upload: TRANSPORT,
  },
  render: (args) => <WithReadout {...(args as UploadInputProps)} />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement);

    // ~3 MB of noise: an order of magnitude past the 200 kB threshold.
    dropFile(canvasElement, await makeNoisyPng(1200, 800));

    await waitFor(() => expect(canvas.getByTestId('stored-shape')).toHaveTextContent('base64'), {
      timeout: 15_000,
    });
    await waitFor(() =>
      expect(canvas.getByTestId('stored-dimensions')).toHaveTextContent(/^dimensions: 200×/)
    );
  },
};

/**
 * The negative control: chunking is still chosen when the file is genuinely large *after* the
 * transform. Resize is 2000px and the threshold is 50 kB, so even the transformed image clears it —
 * the row reports the missing transport, which is how you can see the chunked path was taken.
 */
export const StillChunkedWhenLargeAfterResize: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    source: 'photo',
    label: 'Photo (2000px, chunked above 50 kB)',
    maxFiles: 1,
    showImagePreview: true,
    accept: IMAGE_ACCEPT,
    resizeWidth: 2000,
    upload: {...TRANSPORT, threshold: 50_000},
  },
  render: (args) => <WithReadout {...(args as UploadInputProps)} />,
};

/**
 * Drag a `.docx` onto the zone — the file picker filters it out, drag-and-drop does not. The row
 * reports "This file type is not allowed": the type is checked before the modifier runs, so the
 * document never reaches the canvas and is never reported as a failed image transform instead. The
 * field also goes invalid while the failed row is there, so the form cannot be saved as if nothing
 * had happened.
 */
export const RejectedFileType: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    source: 'photo',
    label: 'Photo (images only)',
    maxFiles: 1,
    showImagePreview: true,
    accept: IMAGE_ACCEPT,
    resizeWidth: 200,
  },
  render: (args) => <WithReadout {...(args as UploadInputProps)} />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement);
    const docx = new File([new Uint8Array(2048)], 'contract.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    dropFile(canvasElement, docx);

    // The row names the reason...
    await waitFor(() => expect(canvas.getByText(/not allowed/i)).toBeInTheDocument());
    // ...and the field itself goes invalid, so the form cannot be saved past it.
    await waitFor(() => expect(canvas.getByText(/were not uploaded/i)).toBeInTheDocument());
  },
};

/**
 * The size cap applies to the stored file. `maxFileSize` is 100 kB and the resize is 200px, so a
 * multi-megabyte photo is accepted — what gets stored is well under the cap. Checking the raw pick
 * instead would reject a file the field is perfectly able to hold.
 */
export const MaxFileSizeAfterResize: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    source: 'photo',
    label: 'Photo (max 100 kB stored)',
    maxFiles: 1,
    showImagePreview: true,
    accept: IMAGE_ACCEPT,
    resizeWidth: 200,
    maxFileSize: 100_000,
  },
  render: (args) => <WithReadout {...(args as UploadInputProps)} />,
};
