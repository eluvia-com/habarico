import {describe, expect, it} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useFileModifier} from '../useFileModifier';

const file = (type: string) => new File(['x'], 'f', {type});

describe('useFileModifier', () => {
  it('returns no modifier when neither resize nor crop is configured', () => {
    const {result} = renderHook(() => useFileModifier(undefined, undefined));

    expect(result.current(file('image/jpeg'))).toBeUndefined();
  });

  it('returns a modifier for an image when a resize width is set', () => {
    const {result} = renderHook(() => useFileModifier(400, undefined));

    expect(result.current(file('image/jpeg'))).toBeInstanceOf(Function);
  });

  it('returns no modifier for a non-image file, whatever the image options say', () => {
    const {result} = renderHook(() => useFileModifier(400, 1));

    expect(result.current(file('application/pdf'))).toBeUndefined();
  });
});
