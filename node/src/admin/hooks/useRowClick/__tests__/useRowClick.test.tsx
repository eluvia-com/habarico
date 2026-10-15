import React from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useRowClick} from '../useRowClick';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router', () => ({useNavigate: () => navigate}));
vi.mock('@foundation/utils/navigation', () => ({
  getNavigationMode: () => 'same',
  openByMode: () => false,
}));

const record = {id: 1};
const event = {} as React.MouseEvent;

const setup = (single?: () => void, double?: () => void) =>
  renderHook(() => useRowClick(single, double)).result;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('useRowClick', () => {
  it('fires the single-click slot immediately when only single is configured', () => {
    const single = vi.fn();
    const result = setup(single);

    act(() => result.current.handleClickStart(event));
    act(() => {
      result.current.getRowClickWithData(1, record);
    });

    expect(single).toHaveBeenCalledTimes(1);
    expect(single).toHaveBeenCalledWith(record, 'same');
  });

  it('fires the double-click slot only on double click when only double is configured', () => {
    const double = vi.fn();
    const result = setup(undefined, double);

    act(() => result.current.handleClickStart(event));
    act(() => {
      result.current.getRowClickWithData(1, record);
    });
    expect(double).not.toHaveBeenCalled();

    act(() => result.current.handleDoubleClick());
    expect(double).toHaveBeenCalledTimes(1);
    expect(double).toHaveBeenCalledWith(record, 'same');
  });

  it('defers the single-click slot when both slots are active', () => {
    const single = vi.fn();
    const double = vi.fn();
    const result = setup(single, double);

    act(() => result.current.handleClickStart(event));
    act(() => {
      result.current.getRowClickWithData(1, record);
    });
    // deferred: not fired synchronously
    expect(single).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(250));
    expect(single).toHaveBeenCalledTimes(1);
    expect(double).not.toHaveBeenCalled();
  });

  it('cancels the deferred single-click and fires double on a double click', () => {
    const single = vi.fn();
    const double = vi.fn();
    const result = setup(single, double);

    act(() => result.current.handleClickStart(event));
    act(() => {
      result.current.getRowClickWithData(1, record);
    });
    act(() => result.current.handleDoubleClick());
    act(() => vi.advanceTimersByTime(300));

    expect(single).not.toHaveBeenCalled();
    expect(double).toHaveBeenCalledTimes(1);
  });

  it('treats a long press as a drag and does not activate', () => {
    const single = vi.fn();
    const result = setup(single);

    act(() => result.current.handleClickStart(event));
    act(() => vi.advanceTimersByTime(300)); // press held > threshold
    act(() => {
      result.current.getRowClickWithData(1, record);
    });

    expect(single).not.toHaveBeenCalled();
  });
});
