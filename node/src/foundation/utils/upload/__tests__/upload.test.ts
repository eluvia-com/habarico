import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {ChunkedUploadTransport} from '../registry';
import type {UploadTransportConfig} from '../types';

// `uploadFile` resolves the chunked transport through the module-global registry, so every test
// starts from a fresh module graph — otherwise a registration would leak into the next test. The
// dynamic import keeps `upload` and `registry` on the same instance.
const freshUpload = async () => {
  vi.resetModules();
  const [upload, registry] = await Promise.all([import('../upload'), import('../registry')]);
  return {...upload, ...registry};
};

const makeFile = (size: number, name = 'f.bin') => {
  const f = new File(['x'], name, {type: 'text/plain'});
  Object.defineProperty(f, 'size', {value: size});
  return f;
};
const transport: UploadTransportConfig = {
  provider: 's3-multipart',
  threshold: 1000,
  chunkSize: 5_242_880,
  initiateUrl: 'https://api/u/initiate/?model=a.b&field=c',
};
const auth = () => ({Authorization: 'Bearer t'});

beforeEach(() => vi.resetModules());

describe('uploadFile', () => {
  it('uses the registered chunked transport when a transport is set and the file >= threshold', async () => {
    const {uploadFile, registerChunkedUploadTransport} = await freshUpload();
    const chunked = vi.fn<ChunkedUploadTransport>(() => ({
      promise: Promise.resolve({upload_key: 'k'}),
      abort: () => {},
    }));
    registerChunkedUploadTransport(chunked);

    const {promise} = uploadFile(makeFile(2000), {transport, getAuthHeaders: auth});

    expect(chunked).toHaveBeenCalledOnce();
    await expect(promise).resolves.toEqual({upload_key: 'k'});
  });

  it('rejects with an actionable error when a chunked upload is required but no transport is registered', async () => {
    const {uploadFile} = await freshUpload();

    const {promise} = uploadFile(makeFile(2000), {transport, getAuthHeaders: auth});

    await expect(promise).rejects.toThrow(/habarico-enterprise/);
  });

  it('falls back to base64 when the file is below the threshold', async () => {
    const {uploadFile, registerChunkedUploadTransport} = await freshUpload();
    const chunked = vi.fn<ChunkedUploadTransport>();
    registerChunkedUploadTransport(chunked);

    const {promise} = uploadFile(makeFile(500), {transport, getAuthHeaders: auth});

    const result = (await promise) as {content: string; filename: string};
    expect(chunked).not.toHaveBeenCalled();
    expect(result.filename).toBe('f.bin');
    expect(typeof result.content).toBe('string');
  });

  it('falls back to base64 when no transport is set, even without a registered transport', async () => {
    const {uploadFile} = await freshUpload();

    const {promise} = uploadFile(makeFile(9_999_999), {getAuthHeaders: auth});

    const result = (await promise) as {filename: string};
    expect(result.filename).toBe('f.bin');
  });
});
