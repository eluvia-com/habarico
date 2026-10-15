import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useExporter} from '../useExporter';

const exportMock = vi.fn();
const notifyMock = vi.fn();

vi.mock('react-admin', async () => {
  const actual = await vi.importActual<typeof import('react-admin')>('react-admin');
  return {
    ...actual,
    useDataProvider: () => ({export: exportMock}),
    useNotify: () => notifyMock,
  };
});

describe('useExporter', () => {
  let clickedAnchor: {href: string; download: string} | undefined;
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickedAnchor = undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clickedAnchor = {href: this.href, download: this.download};
    });
    createObjectURLMock = vi.fn(() => 'blob:mock-url');
    revokeObjectURLMock = vi.fn();
    // jsdom's URL does not implement object URLs at all
    Object.assign(URL, {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    delete (URL as {createObjectURL?: unknown}).createObjectURL;
    delete (URL as {revokeObjectURL?: unknown}).revokeObjectURL;
  });

  it('calls dataProvider.export and downloads the blob under the server filename', async () => {
    const blob = new Blob(['a,b\n1,2'], {type: 'text/csv'});
    exportMock.mockResolvedValue({status: 200, blob, filename: 'articles.csv'});

    const {result} = renderHook(() => useExporter('blog/articles'));
    await result.current({format: 'csv', fields: ['name'], ids: [1, 2]});

    expect(exportMock).toHaveBeenCalledWith('blog/articles', {
      format: 'csv',
      fields: ['name'],
      ids: [1, 2],
    });
    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    expect(clickedAnchor).toEqual({href: 'blob:mock-url', download: 'articles.csv'});
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });

  it('falls back to a <resource>.<format> filename when the server does not provide one', async () => {
    exportMock.mockResolvedValue({status: 200, blob: new Blob(['x']), filename: undefined});

    const {result} = renderHook(() => useExporter('blog/articles'));
    await result.current({format: 'csv'});

    expect(clickedAnchor?.download).toBe('blog_articles.csv');
  });

  it('shows an info notification instead of downloading on a 202 response', async () => {
    exportMock.mockResolvedValue({status: 202});

    const {result} = renderHook(() => useExporter('blog/articles'));
    await result.current({format: 'csv'});

    expect(notifyMock).toHaveBeenCalledWith('ra.notification.export_running', {type: 'info'});
    expect(createObjectURLMock).not.toHaveBeenCalled();
    expect(clickedAnchor).toBeUndefined();
  });

  it('propagates errors from dataProvider.export', async () => {
    exportMock.mockRejectedValue(new Error('boom'));

    const {result} = renderHook(() => useExporter('blog/articles'));

    await expect(result.current({format: 'csv'})).rejects.toThrow('boom');
    expect(clickedAnchor).toBeUndefined();
  });
});
