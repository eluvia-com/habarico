import {afterEach, describe, expect, it, vi} from 'vitest';
import {cropImage, resizeImage} from '../image';

// jsdom never decodes image data, so neither `onload` nor `onerror` would fire on a real `Image`.
// Stub one that reports a decode failure as soon as a source is assigned.
class FailingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 0;
  height = 0;
  naturalWidth = 0;
  naturalHeight = 0;

  set src(_value: string) {
    queueMicrotask(() => this.onerror?.());
  }
}

const BROKEN = 'data:image/jpeg;base64,notanimage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('image decode failures', () => {
  it('resizeImage rejects instead of hanging when the image cannot be decoded', async () => {
    vi.stubGlobal('Image', FailingImage);

    await expect(resizeImage(BROKEN, 'image/jpeg', 100)).rejects.toThrow(/decode/i);
  });

  it('cropImage rejects instead of hanging when the image cannot be decoded', async () => {
    vi.stubGlobal('Image', FailingImage);

    await expect(cropImage(BROKEN, 'image/jpeg', 1)).rejects.toThrow(/decode/i);
  });
});
