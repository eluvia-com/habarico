import {describe, expect, it} from 'vitest';
import {applyFileModifier, isImageFilename} from '../file';

const makeFile = (content: string, name: string, type: string) => new File([content], name, {type});

const dataUrl = (type: string, text: string) => `data:${type};base64,${btoa(text)}`;

const readText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

describe('applyFileModifier', () => {
  it('returns the original file untouched when there is no modifier', async () => {
    const file = makeFile('abc', 'photo.jpg', 'image/jpeg');

    await expect(applyFileModifier(file)).resolves.toBe(file);
  });

  it('returns a file holding the transformed bytes', async () => {
    const file = makeFile('original', 'photo.jpg', 'image/jpeg');

    const result = await applyFileModifier(file, async () => dataUrl('image/jpeg', 'resized'));

    expect(await readText(result)).toBe('resized');
    expect(result.name).toBe('photo.jpg');
    expect(result.type).toBe('image/jpeg');
  });

  it('derives type and extension from the produced Data URI', async () => {
    // canvas silently falls back to image/png for a type it cannot encode
    const file = makeFile('original', 'photo.jpg', 'image/jpeg');

    const result = await applyFileModifier(file, async () => dataUrl('image/png', 'converted'));

    expect(result.type).toBe('image/png');
    expect(result.name).toBe('photo.png');
  });

  it('replaces only the extension when the base name contains dots', async () => {
    const file = makeFile('x', 'my.holiday.photo.jpeg', 'image/jpeg');

    const result = await applyFileModifier(file, async () => dataUrl('image/png', 'y'));

    expect(result.name).toBe('my.holiday.photo.png');
  });

  it('keeps the original name when the produced type has no known extension', async () => {
    const file = makeFile('x', 'drawing.jpg', 'image/jpeg');

    const result = await applyFileModifier(file, async () => dataUrl('image/svg+xml', 'y'));

    expect(result.name).toBe('drawing.jpg');
  });

  it('rejects when the modifier fails', async () => {
    const file = makeFile('x', 'photo.jpg', 'image/jpeg');

    await expect(
      applyFileModifier(file, async () => {
        throw new Error('decode failed');
      })
    ).rejects.toThrow('decode failed');
  });
});

describe('isImageFilename', () => {
  it.each(['photo.jpg', 'photo.JPEG', 'logo.png', 'icon.svg', 'banner.webp', 'scan.v2.gif'])(
    'treats %s as an image',
    (filename) => {
      expect(isImageFilename(filename)).toBe(true);
    }
  );

  it.each(['contract.pdf', 'report.docx', 'archive.zip', 'photo.heic', 'scan.tiff', 'README', ''])(
    'does not treat %s as an image',
    (filename) => {
      expect(isImageFilename(filename)).toBe(false);
    }
  );
});
