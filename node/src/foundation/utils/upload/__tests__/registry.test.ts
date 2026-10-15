import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {ChunkedUploadTransport} from '../registry';

// Each test needs a pristine module instance: the registry holds process-wide state, so a
// registration from one test would leak into the next. `vi.resetModules()` + a dynamic import gives
// a fresh module rather than exposing a reset helper that only tests would ever call.
const freshRegistry = () => {
  vi.resetModules();
  return import('../registry');
};

const transportA: ChunkedUploadTransport = () => ({
  promise: Promise.resolve({upload_key: 'a'}),
  abort: () => {},
});
const transportB: ChunkedUploadTransport = () => ({
  promise: Promise.resolve({upload_key: 'b'}),
  abort: () => {},
});

beforeEach(() => vi.resetModules());

describe('chunked upload transport registry', () => {
  it('has no transport until one is registered', async () => {
    const {getChunkedUploadTransport} = await freshRegistry();
    expect(getChunkedUploadTransport()).toBeUndefined();
  });

  it('returns the registered transport', async () => {
    const {registerChunkedUploadTransport, getChunkedUploadTransport} = await freshRegistry();
    registerChunkedUploadTransport(transportA);
    expect(getChunkedUploadTransport()).toBe(transportA);
  });

  it('replaces the previous transport when registered twice', async () => {
    const {registerChunkedUploadTransport, getChunkedUploadTransport} = await freshRegistry();
    registerChunkedUploadTransport(transportA);
    registerChunkedUploadTransport(transportB);
    expect(getChunkedUploadTransport()).toBe(transportB);
  });
});
