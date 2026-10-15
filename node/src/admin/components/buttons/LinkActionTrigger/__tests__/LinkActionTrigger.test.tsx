import React from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {LinkActionTrigger} from '../LinkActionTrigger';

describe('LinkActionTrigger', () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the URL once on mount, without an opener', () => {
    render(<LinkActionTrigger url={'https://example.com/invoice.pdf'} />);

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      'https://example.com/invoice.pdf',
      '_blank',
      'noopener,noreferrer'
    );
  });

  // The trigger fires from an effect, with no click of its own — an unsafe URL would run
  // unattended in the admin's session, which is the worst case of the two link components.
  it('refuses an unsafe URL handed to it by the schema or an action response', () => {
    render(<LinkActionTrigger url={'javascript:alert(document.cookie)'} />);

    expect(open).not.toHaveBeenCalled();
  });

  it('reports completion so the parent action does not stay pending', () => {
    const onDone = vi.fn();
    render(<LinkActionTrigger url={'https://example.com'} onDone={onDone} />);

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('reports completion even when the URL was refused', () => {
    const onDone = vi.fn();
    render(<LinkActionTrigger url={'javascript:alert(1)'} onDone={onDone} />);

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does not re-fire when the parent re-renders with a new onDone identity', () => {
    const {rerender} = render(<LinkActionTrigger url={'https://example.com'} onDone={() => {}} />);
    rerender(<LinkActionTrigger url={'https://example.com'} onDone={() => {}} />);

    expect(open).toHaveBeenCalledTimes(1);
  });
});
