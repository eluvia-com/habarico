import {describe, expect, it} from 'vitest';
import {prepareForDraft} from '../useDraftStore';

describe('prepareForDraft', () => {
  it('strips File objects', () => {
    const file = new File(['content'], 'photo.jpg', {type: 'image/jpeg'});
    expect(prepareForDraft(file)).toBeUndefined();
  });

  it('strips FileList-like objects', () => {
    // jsdom does not implement DataTransfer, but an <input type="file"> exposes a real FileList.
    const el = document.createElement('input');
    el.type = 'file';
    expect(prepareForDraft(el.files)).toBeUndefined();
  });

  it('keeps strings under the size limit', () => {
    const small = 'hello world';
    expect(prepareForDraft(small)).toBe(small);
  });

  it('strips strings over the size limit', () => {
    const large = 'x'.repeat(51 * 1024);
    expect(prepareForDraft(large)).toBeUndefined();
  });

  it('keeps strings exactly at the limit', () => {
    const atLimit = 'a'.repeat(50 * 1024);
    expect(prepareForDraft(atLimit)).toBe(atLimit);
  });

  it('strips File values nested in an object', () => {
    const file = new File(['data'], 'doc.pdf');
    const result = prepareForDraft({name: 'John', attachment: file});
    expect(result).toEqual({name: 'John', attachment: undefined});
  });

  it('strips large strings nested in an object', () => {
    const large = 'x'.repeat(51 * 1024);
    const result = prepareForDraft({title: 'ok', image: large});
    expect(result).toEqual({title: 'ok', image: undefined});
  });

  it('processes arrays recursively', () => {
    const file = new File(['x'], 'f.jpg');
    const result = prepareForDraft(['text', file, 42]);
    expect(result).toEqual(['text', undefined, 42]);
  });

  it('processes deeply nested objects', () => {
    const file = new File(['x'], 'f.jpg');
    const input = {
      contact: {
        email: 'a@b.com',
        avatar: file,
      },
      tags: ['foo', 'bar'],
    };
    expect(prepareForDraft(input)).toEqual({
      contact: {email: 'a@b.com', avatar: undefined},
      tags: ['foo', 'bar'],
    });
  });

  it('passes through primitive values unchanged', () => {
    expect(prepareForDraft(42)).toBe(42);
    expect(prepareForDraft(true)).toBe(true);
    expect(prepareForDraft(null)).toBeNull();
    expect(prepareForDraft(undefined)).toBeUndefined();
  });
});
