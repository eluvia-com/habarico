import {afterEach, describe, expect, it, vi} from 'vitest';
import {cropImage, parseAspectRatio, resizeImage} from '../image';

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

describe('parseAspectRatio', () => {
  it('keeps a number', () => {
    expect(parseAspectRatio(1.5)).toBe(1.5);
  });

  it('reads a W:H string as width / height', () => {
    expect(parseAspectRatio('16:9')).toBeCloseTo(16 / 9);
    expect(parseAspectRatio('1.5:1')).toBe(1.5);
  });

  it('reads a plain numeric string', () => {
    expect(parseAspectRatio('1.5')).toBe(1.5);
  });

  it('returns undefined for a missing, malformed or non-positive ratio', () => {
    for (const value of [undefined, '', 'wide', '16:0', '0', '-4:3', 0]) {
      expect(parseAspectRatio(value)).toBeUndefined();
    }
  });
});
