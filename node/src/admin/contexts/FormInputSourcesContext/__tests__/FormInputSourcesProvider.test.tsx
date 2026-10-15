import React, {useEffect} from 'react';
import {beforeEach, describe, expect, it} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {FormInputSourcesProvider} from '../FormInputSourcesProvider';
import {
  useFormInputSourcesContext,
  useFormInputSourcesRegistration,
} from '../useFormInputSourcesContext';

// ---------------------------------------------------------------------------
// `useContext` subscribes to the whole context value by identity — destructuring
// happens after the hook returns, too late to narrow anything. Splitting the stable
// callbacks into their own context is what keeps a registering input out of the
// `sources` list's re-renders, and these count that.
// ---------------------------------------------------------------------------

const commits: Record<string, number> = {};

const Counted = ({name, children}: {name: string; children: React.ReactNode}) => {
  useEffect(() => {
    commits[name] = (commits[name] || 0) + 1;
  });
  return <>{children}</>;
};

const CallbacksOnly = () => {
  const {register} = useFormInputSourcesRegistration();
  return <Counted name="callbacksOnly">{typeof register}</Counted>;
};

const ListConsumer = () => {
  const {sources} = useFormInputSourcesContext();
  return <Counted name="listConsumer">{sources.length}</Counted>;
};

let nextField = 0;

const Registrar = () => {
  const {register} = useFormInputSourcesRegistration();
  return (
    <button type="button" onClick={() => register?.(`field_${nextField++}`)}>
      register
    </button>
  );
};

const registerOnce = () => fireEvent.click(screen.getByRole('button', {name: 'register'}));

beforeEach(() => {
  Object.keys(commits).forEach((key) => delete commits[key]);
  nextField = 0;
});

describe('FormInputSourcesProvider', () => {
  it('does not re-render a callbacks-only consumer when a source registers', () => {
    render(
      <FormInputSourcesProvider>
        <CallbacksOnly />
        <ListConsumer />
        <Registrar />
      </FormInputSourcesProvider>
    );
    const before = {...commits};

    registerOnce();
    registerOnce();
    registerOnce();

    expect(commits.callbacksOnly).toBe(before.callbacksOnly);
    // The list is what changed, so its own consumer does re-render - one per registration.
    expect(commits.listConsumer).toBe((before.listConsumer || 0) + 3);
  });

  it('registers and unregisters sources', () => {
    const Probe = () => {
      const {sources, register, unregister} = useFormInputSourcesContext();
      return (
        <>
          <output data-testid="sources">{sources.join(',')}</output>
          <button type="button" onClick={() => register?.('price')}>
            add
          </button>
          <button type="button" onClick={() => unregister?.('price')}>
            drop
          </button>
        </>
      );
    };
    render(
      <FormInputSourcesProvider>
        <Probe />
      </FormInputSourcesProvider>
    );
    const sources = () => screen.getByTestId('sources').textContent;

    fireEvent.click(screen.getByRole('button', {name: 'add'}));
    expect(sources()).toBe('price');

    // Registering the same source twice must not duplicate it.
    fireEvent.click(screen.getByRole('button', {name: 'add'}));
    expect(sources()).toBe('price');

    fireEvent.click(screen.getByRole('button', {name: 'drop'}));
    expect(sources()).toBe('');
  });
});
