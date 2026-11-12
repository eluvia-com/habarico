import React from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen, waitFor} from '@testing-library/react';
import {useViewportFitHeight} from '../useViewportFitHeight';

const Probe = ({enabled}: {enabled?: boolean}) => {
  const {ref, maxHeight} = useViewportFitHeight({bottomReserve: 50, minHeight: 300, enabled});
  return (
    <div ref={ref} data-testid={'probe'}>
      {maxHeight ?? 'none'}
    </div>
  );
};

const placeAt = (top: number) =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({top} as DOMRect);

// jsdom lays nothing out, so every element reports no client rects — as a hidden one would.
const setRendered = (rendered: boolean) =>
  vi
    .spyOn(HTMLElement.prototype, 'getClientRects')
    .mockReturnValue((rendered ? [{}] : []) as unknown as DOMRectList);

const resizeCallbacks: (() => void)[] = [];

describe('useViewportFitHeight', () => {
  beforeEach(() => {
    resizeCallbacks.length = 0;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resizeCallbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      }
    );
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns the viewport space below the element minus the reserve', async () => {
    placeAt(200);
    setRendered(true);
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('650'));
  });

  it('never goes below minHeight', async () => {
    placeAt(700);
    setRendered(true);
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('300'));
  });

  it('recalculates when the viewport resizes', async () => {
    placeAt(200);
    setRendered(true);
    const innerHeight = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('650'));

    innerHeight.mockReturnValue(1000);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('750'));
  });

  it('waits while the element is hidden and measures once it is shown', async () => {
    placeAt(0);
    const rendered = setRendered(false);
    render(<Probe />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByTestId('probe')).toHaveTextContent('none');

    placeAt(200);
    rendered.mockReturnValue([{}] as unknown as DOMRectList);
    act(() => resizeCallbacks.forEach((callback) => callback()));
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('650'));
  });

  it('measures nothing when disabled', async () => {
    placeAt(200);
    setRendered(true);
    render(<Probe enabled={false} />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByTestId('probe')).toHaveTextContent('none');
  });
});
