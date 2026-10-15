import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {type BuildFileModifier, useFileModifier} from '@foundation/hooks/useFileModifier';
import {uploadFile} from '@foundation/utils/upload';
import {act, renderHook, waitFor} from '@testing-library/react';
import {useUploadQueue} from '../useUploadQueue';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-admin', () => ({
  useTranslate: () => (key: string) => key,
  useAuthProvider: () => undefined,
}));

// Controlled uploadFile mock — each call pushes a resolver/rejecter
// so tests can trigger success/failure at will.
type PendingUpload = {resolve: (v: Record<string, unknown>) => void; reject: (e: Error) => void};
const pendingUploads: PendingUpload[] = [];
const mockAbort = vi.fn();

vi.mock('@foundation/utils/upload', async (importActual) => {
  const actual = await importActual<typeof import('@foundation/utils/upload')>();
  return {
    ...actual,
    uploadFile: vi.fn((_file: File) => {
      let resolve!: (v: Record<string, unknown>) => void;
      let reject!: (e: Error) => void;
      const promise = new Promise<Record<string, unknown>>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      pendingUploads.push({resolve, reject});
      return {promise, abort: mockAbort};
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeFile = (name = 'file.bin', size = 100) => {
  const f = new File([new Uint8Array(size)], name, {type: 'application/octet-stream'});
  return f;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUploadQueue', () => {
  beforeEach(() => {
    pendingUploads.length = 0;
    mockAbort.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts empty', () => {
    const {result} = renderHook(() => useUploadQueue({}));
    expect(result.current.entries).toHaveLength(0);
  });

  it('initialEntries are reflected immediately', () => {
    const initial = [{id: 'a', filename: 'x.png', progress: null, error: null, done: true}];
    const {result} = renderHook(() => useUploadQueue({initialEntries: initial}));
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].filename).toBe('x.png');
  });

  it('addAndUpload adds an entry and starts upload', async () => {
    const {result} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile('report.pdf')]);
    });

    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.entries[0].filename).toBe('report.pdf');
  });

  it('successful upload sets uploadResult and calls onUploadSuccess', async () => {
    const onUploadSuccess = vi.fn();
    const {result} = renderHook(() => useUploadQueue({onUploadSuccess}));

    act(() => {
      result.current.addAndUpload([makeFile('doc.pdf')]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));

    await act(async () => {
      pendingUploads[0].resolve({filename: 'doc.pdf', content: 'base64=='});
    });

    await waitFor(() => expect(result.current.entries[0].uploadResult).toBeDefined());
    expect(result.current.entries[0].uploaded).toBe(true);
    expect(onUploadSuccess).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({filename: 'doc.pdf'})
    );
    expect(result.current.entries[0].progress).toBeNull();
  });

  it('failed upload sets error message on entry', async () => {
    const {result} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile()]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));

    await act(async () => {
      pendingUploads[0].reject(new Error('network error'));
    });

    await waitFor(() => expect(result.current.entries[0].error).toBe('network error'));
    expect(result.current.entries[0].progress).toBeNull();
  });

  it('aborted upload (message="aborted") does not set error', async () => {
    const {result} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile()]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));

    await act(async () => {
      pendingUploads[0].reject(new Error('aborted'));
    });

    await waitFor(() => expect(result.current.entries[0].progress).toBeNull());
    expect(result.current.entries[0].error).toBeNull();
  });

  it('removeEntry removes the entry and calls abort', async () => {
    const {result} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile()]);
    });

    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    const id = result.current.entries[0].id;

    act(() => {
      result.current.removeEntry(id);
    });

    expect(result.current.entries).toHaveLength(0);
    expect(mockAbort).toHaveBeenCalled();
  });

  it('removeAll clears all entries and aborts all uploads', async () => {
    const {result} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile('a.bin'), makeFile('b.bin')]);
    });

    await waitFor(() => expect(result.current.entries).toHaveLength(2));

    act(() => {
      result.current.removeAll();
    });

    expect(result.current.entries).toHaveLength(0);
    expect(mockAbort).toHaveBeenCalledTimes(2);
  });

  it('retryUpload resets error and restarts upload', async () => {
    const {result} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile()]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));

    // Fail the first upload
    await act(async () => {
      pendingUploads[0].reject(new Error('timeout'));
    });

    await waitFor(() => expect(result.current.entries[0].error).toBe('timeout'));
    const id = result.current.entries[0].id;

    act(() => {
      result.current.retryUpload(id);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(2));
    expect(result.current.entries[0].error).toBeNull();
  });

  it('retryUpload is a no-op for entries without a file', () => {
    const initial = [{id: 'a', filename: 'x.png', progress: null, error: 'old error', done: false}];
    const {result} = renderHook(() => useUploadQueue({initialEntries: initial}));

    act(() => {
      result.current.retryUpload('a');
    });

    // No new upload started, entry unchanged
    expect(pendingUploads).toHaveLength(0);
    expect(result.current.entries[0].error).toBe('old error');
  });

  it('file exceeding maxFileSize gets an error without starting upload', async () => {
    const {result} = renderHook(() => useUploadQueue({maxFileSize: 50}));

    act(() => {
      result.current.addAndUpload([makeFile('big.bin', 100)]);
    });

    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.file_too_large')
    );
    expect(pendingUploads).toHaveLength(0);
  });

  it('unmount aborts all in-progress uploads', async () => {
    const {result, unmount} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile()]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));

    unmount();

    expect(mockAbort).toHaveBeenCalled();
  });

  it('updateEntry patches a specific entry', async () => {
    const {result} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile()]);
    });

    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    const id = result.current.entries[0].id;

    act(() => {
      result.current.updateEntry(id, {progress: 42});
    });

    expect(result.current.entries[0].progress).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// File modifier + validation (HAB-754)
// ---------------------------------------------------------------------------

const asDataUrl = (type: string, text: string) => `data:${type};base64,${btoa(text)}`;

const makeImage = (name = 'photo.jpg', size = 5000, type = 'image/jpeg') =>
  new File([new Uint8Array(size)], name, {type});

/** Modifier factory that replaces the file with `text` encoded as `type`. */
const transformTo =
  (type: string, text: string): BuildFileModifier =>
  () =>
  async () =>
    asDataUrl(type, text);

const uploadedFile = () => vi.mocked(uploadFile).mock.calls[0][0];

// A browser reports an undecodable source through `onerror`; jsdom fires neither handler.
class FailingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.());
  }
}

const IMAGE_ACCEPT = ['.png', '.jpg', '.jpeg', '.bmp', '.gif'];

describe('useUploadQueue — file modifier and validation', () => {
  beforeEach(() => {
    pendingUploads.length = 0;
    mockAbort.mockClear();
    vi.mocked(uploadFile).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checks the type before the modifier runs, so a wrong file never reaches the canvas', async () => {
    const modifier = vi.fn<BuildFileModifier>(() => async (dataUrl: string) => dataUrl);
    const docx = new File([new Uint8Array(2000)], 'contract.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const {result} = renderHook(() =>
      useUploadQueue({accept: IMAGE_ACCEPT, fileModifier: modifier})
    );

    act(() => {
      result.current.addAndUpload([docx]);
    });

    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.file_type_not_allowed')
    );
    expect(modifier).not.toHaveBeenCalled();
    expect(pendingUploads).toHaveLength(0);
  });

  it('rejects a non-image file on an image field by its type, not by a failed transform', async () => {
    vi.stubGlobal('Image', FailingImage);
    const docx = new File([new Uint8Array(2000)], 'contract.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const {result} = renderHook(() =>
      // A `base64-image` field carrying `resizeWidth`: the modifier factory is live for every
      // picked file, image or not.
      useUploadQueue({accept: IMAGE_ACCEPT, fileModifier: useFileModifier(400, undefined)})
    );

    act(() => {
      result.current.addAndUpload([docx]);
    });

    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.file_type_not_allowed')
    );
    expect(pendingUploads).toHaveLength(0);
  });

  it('hands the transformed file to uploadFile, not the picked one', async () => {
    const {result} = renderHook(() =>
      useUploadQueue({fileModifier: transformTo('image/jpeg', 'resized')})
    );

    act(() => {
      result.current.addAndUpload([makeImage()]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));
    expect(uploadedFile().size).toBe('resized'.length);
    expect(result.current.entries[0].fileSize).toBe('resized'.length);
  });

  it('decides the chunked route from the size after transformation', async () => {
    const {result} = renderHook(() =>
      useUploadQueue({
        upload: {provider: 'tus', threshold: 1000, chunkSize: 5_242_880, endpoint: 'https://t/'},
        fileModifier: transformTo('image/jpeg', 'tiny'),
      })
    );

    // 5000 raw bytes is past the threshold; 'tiny' is not.
    act(() => {
      result.current.addAndUpload([makeImage()]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));
    expect(result.current.entries[0].isChunkedUpload).toBe(false);
  });

  it('evaluates maxFileSize against the transformed file', async () => {
    const {result} = renderHook(() =>
      useUploadQueue({maxFileSize: 500, fileModifier: transformTo('image/jpeg', 'small')})
    );

    act(() => {
      result.current.addAndUpload([makeImage()]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));
    expect(result.current.entries[0].error).toBeNull();
  });

  it('rejects a file whose transformed type is not accepted', async () => {
    const {result} = renderHook(() =>
      useUploadQueue({accept: ['.jpg'], fileModifier: transformTo('image/png', 'converted')})
    );

    act(() => {
      result.current.addAndUpload([makeImage()]);
    });

    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.file_type_not_allowed')
    );
    expect(pendingUploads).toHaveLength(0);
  });

  it('rejects a picked file that does not match accept', async () => {
    const {result} = renderHook(() => useUploadQueue({accept: ['image/*']}));

    act(() => {
      result.current.addAndUpload([makeFile('notes.bin', 10)]);
    });

    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.file_type_not_allowed')
    );
    expect(pendingUploads).toHaveLength(0);
  });

  it('marks the entry as processing while the modifier runs, and counts it as busy', async () => {
    // The row is marked processing before the file is read, so the modifier - and with it the
    // resolver this test drives - only comes into existence a FileReader round-trip later. That is
    // what `invoked` waits for; the `processing` flag flips too early to be that barrier.
    let finishTransform!: (value: string) => void;
    let markInvoked!: () => void;
    const invoked = new Promise<void>((resolve) => {
      markInvoked = resolve;
    });
    const modifier: BuildFileModifier = () => () =>
      new Promise<string>((resolve) => {
        finishTransform = resolve;
        markInvoked();
      });
    const {result} = renderHook(() => useUploadQueue({fileModifier: modifier}));

    act(() => {
      result.current.addAndUpload([makeImage()]);
    });

    await waitFor(() => expect(result.current.entries[0].processing).toBe(true));
    expect(result.current.busyCount).toBe(1);
    expect(pendingUploads).toHaveLength(0);

    await invoked;
    await act(async () => {
      finishTransform(asDataUrl('image/jpeg', 'done'));
    });
    await waitFor(() => expect(pendingUploads).toHaveLength(1));
  });

  it('stays busy through an inline upload, which reports no progress of its own', async () => {
    const {result} = renderHook(() => useUploadQueue({}));

    act(() => {
      result.current.addAndUpload([makeFile()]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));
    expect(result.current.entries[0].progress).toBeNull();
    expect(result.current.entries[0].processing).toBe(true);
    expect(result.current.busyCount).toBe(1);

    await act(async () => {
      pendingUploads[0].resolve({filename: 'f', content: 'x'});
    });

    await waitFor(() => expect(result.current.busyCount).toBe(0));
    expect(result.current.entries[0].processing).toBeFalsy();
  });

  it('stops being busy when the transform fails', async () => {
    const failing: BuildFileModifier = () => async () => {
      throw new Error('broken image');
    };
    const {result} = renderHook(() => useUploadQueue({fileModifier: failing}));

    act(() => {
      result.current.addAndUpload([makeImage()]);
    });

    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.image_processing_failed')
    );
    expect(result.current.entries[0].processing).toBeFalsy();
    expect(result.current.busyCount).toBe(0);
  });

  it('reports progress rather than processing on the chunked path', async () => {
    const {result} = renderHook(() =>
      useUploadQueue({
        upload: {provider: 'tus', threshold: 10, chunkSize: 5_242_880, endpoint: 'https://t/'},
      })
    );

    act(() => {
      result.current.addAndUpload([makeFile('big.bin', 5000)]);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(1));
    expect(result.current.entries[0].progress).toBe(0);
    expect(result.current.entries[0].processing).toBeFalsy();
    expect(result.current.busyCount).toBe(1);
  });

  it('retrying a rejected file re-runs the checks instead of uploading it', async () => {
    const docx = new File([new Uint8Array(2000)], 'contract.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const {result} = renderHook(() => useUploadQueue({accept: IMAGE_ACCEPT}));

    act(() => {
      result.current.addAndUpload([docx]);
    });
    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.file_type_not_allowed')
    );

    act(() => {
      result.current.retryUpload(result.current.entries[0].id);
    });

    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.file_type_not_allowed')
    );
    expect(pendingUploads).toHaveLength(0);
  });

  it('retrying a failed upload sends the transformed file, never the raw pick', async () => {
    const {result} = renderHook(() =>
      useUploadQueue({fileModifier: transformTo('image/jpeg', 'resized')})
    );

    act(() => {
      result.current.addAndUpload([makeImage()]);
    });
    await waitFor(() => expect(pendingUploads).toHaveLength(1));
    act(() => {
      pendingUploads[0].reject(new Error('network down'));
    });
    await waitFor(() => expect(result.current.entries[0].error).toBe('network down'));

    act(() => {
      result.current.retryUpload(result.current.entries[0].id);
    });

    await waitFor(() => expect(pendingUploads).toHaveLength(2));
    expect(vi.mocked(uploadFile).mock.calls[1][0].size).toBe('resized'.length);
  });

  it('surfaces a modifier failure as an entry error without uploading', async () => {
    const failing: BuildFileModifier = () => async () => {
      throw new Error('broken image');
    };
    const {result} = renderHook(() => useUploadQueue({fileModifier: failing}));

    act(() => {
      result.current.addAndUpload([makeImage()]);
    });

    await waitFor(() =>
      expect(result.current.entries[0].error).toBe('ra.upload_images.image_processing_failed')
    );
    expect(pendingUploads).toHaveLength(0);
  });
});
