import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ReadOnlyBoxProvider} from '../ReadOnlyBoxProvider';
import {useIsReadOnly} from '../useIsReadOnly';

const state = vi.hoisted(() => ({readOnlyView: false}));

vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({readOnly: state.readOnlyView}),
}));

const Probe = () => <span data-testid={'probe'}>{String(useIsReadOnly())}</span>;

const readOnly = () => screen.getByTestId('probe').textContent;

describe('useIsReadOnly', () => {
  it('follows the view when no box scopes it', () => {
    state.readOnlyView = false;
    const {unmount} = render(<Probe />);
    expect(readOnly()).toBe('false');
    unmount();

    state.readOnlyView = true;
    render(<Probe />);
    expect(readOnly()).toBe('true');
  });

  it('is read-only inside a read-only box, whatever the view says', () => {
    state.readOnlyView = false;
    render(
      <ReadOnlyBoxProvider readOnly>
        <Probe />
      </ReadOnlyBoxProvider>
    );
    expect(readOnly()).toBe('true');
  });

  it('keeps the scope closed for a nested box that declares read_only: false', () => {
    state.readOnlyView = false;
    render(
      <ReadOnlyBoxProvider readOnly>
        <ReadOnlyBoxProvider readOnly={false}>
          <Probe />
        </ReadOnlyBoxProvider>
      </ReadOnlyBoxProvider>
    );
    expect(readOnly()).toBe('true');
  });

  it('leaves a writeable box alone', () => {
    state.readOnlyView = false;
    render(
      <ReadOnlyBoxProvider readOnly={false}>
        <Probe />
      </ReadOnlyBoxProvider>
    );
    expect(readOnly()).toBe('false');
  });
});
