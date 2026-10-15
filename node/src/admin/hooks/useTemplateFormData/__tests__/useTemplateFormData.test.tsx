import React, {useEffect, useRef} from 'react';
import {FormProvider, useForm, useFormContext} from 'react-hook-form';
import {beforeEach, describe, expect, it} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {useTemplateFormData} from '../useTemplateFormData';

// ---------------------------------------------------------------------------
// Harness — real registered inputs, driven with `change` events, because what the
// hook promises is that a template stays live "as the user types"; `setValue` is a
// different code path in react-hook-form.
// ---------------------------------------------------------------------------

// Counted in an effect, so the probe stays render-pure: one tick per committed render.
let commits = 0;

const Probe = ({text}: {text: string}) => {
  const formData = useTemplateFormData(text);
  useEffect(() => {
    commits += 1;
  });
  return <span data-testid="form-data">{JSON.stringify(formData ?? null)}</span>;
};

const Harness = ({text}: {text: string}) => {
  const form = useForm({defaultValues: {title: 'Keyboard', address: {city: 'Berlin'}, note: ''}});
  return (
    <FormProvider {...form}>
      <input aria-label="title" {...form.register('title')} />
      <input aria-label="city" {...form.register('address.city')} />
      <input aria-label="note" {...form.register('note')} />
      <Probe text={text} />
    </FormProvider>
  );
};

// Mounted before the probe, so its mount effect runs before the probe's - the window in which a
// subscription does not exist yet.
const ResetOnMount = () => {
  const form = useFormContext();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    form.reset({title: 'Mouse', address: {city: 'Berlin'}, note: ''});
  }, [form]);
  return null;
};

const ResetHarness = () => {
  const form = useForm({defaultValues: {title: 'Keyboard', address: {city: 'Berlin'}, note: ''}});
  return (
    <FormProvider {...form}>
      <ResetOnMount />
      <Probe text="%{formData.title}" />
    </FormProvider>
  );
};

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), {target: {value}});

const formData = () => screen.getByTestId('form-data').textContent;

beforeEach(() => {
  commits = 0;
});

describe('useTemplateFormData', () => {
  it('returns undefined outside a form, so the caller can fall back to the record', () => {
    render(<Probe text="%{formData.title}" />);

    expect(formData()).toBe('null');
  });

  it('keeps a top-level placeholder in sync with the field it reads', () => {
    render(<Harness text="%{formData.title}" />);
    expect(formData()).toBe('{"title":"Keyboard"}');

    type('title', 'Mouse');

    expect(formData()).toBe('{"title":"Mouse"}');
  });

  it('keeps a nested placeholder in sync — the watched name is the top-level field, the change arrives on the full path', () => {
    render(<Harness text="%{formData.address.city}" />);
    expect(formData()).toBe('{"address":{"city":"Berlin"}}');

    type('city', 'Hamburg');

    expect(formData()).toBe('{"address":{"city":"Hamburg"}}');
  });

  it('resolves `data.` placeholders from the form as well', () => {
    render(<Harness text="%{data.title}" />);

    type('title', 'Mouse');

    expect(formData()).toBe('{"title":"Mouse"}');
  });

  // Values are read with `getValues()` at render time rather than held in state, so an update the
  // subscription never saw is still picked up: whatever caused it (here a `reset()` from another
  // component's mount effect, before this subscription exists) re-renders the form anyway.
  it('picks up a reset that lands before the subscription exists', () => {
    render(<ResetHarness />);

    expect(formData()).toBe('{"title":"Mouse"}');
  });

  it('ignores a field the template does not read', () => {
    render(<Harness text="%{formData.title}" />);
    const before = commits;

    type('note', 'irrelevant');

    expect(commits).toBe(before);

    type('title', 'Mouse');

    expect(commits).toBeGreaterThan(before);
  });
});
