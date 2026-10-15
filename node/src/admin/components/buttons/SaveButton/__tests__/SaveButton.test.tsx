import React from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AdminConfig, AdminConfigContext} from '@admin/contexts/AdminConfigContext';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {SaveButton} from '../SaveButton';

// ---------------------------------------------------------------------------
// Mocks — the button's own logic is under test, so its React Admin surroundings
// and the design-system button are reduced to their bare contract.
// ---------------------------------------------------------------------------

const save = vi.fn();
const notify = vi.fn();

vi.mock('react-admin', () => ({
  useNotify: () => notify,
  useSaveContext: () => ({save, saving: false}),
  setSubmissionErrors: vi.fn(),
}));

vi.mock('@admin/components/buttons/ActionButton', () => ({
  ActionButton: ({onClick, disabled, label}: {[key: string]: unknown}) => (
    <button
      type="button"
      onClick={onClick as React.MouseEventHandler}
      disabled={disabled as boolean}
    >
      {label as string}
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Harness — the helper buttons drive the form from inside a component, which is
// what lets the test dirty the form (a pristine one disables the save button).
// ---------------------------------------------------------------------------

const Harness = () => {
  const form = useForm({defaultValues: {name: 'ok'}, mode: 'onChange'});
  return (
    <FormProvider {...form}>
      <input aria-label="name" {...form.register('name', {required: 'required'})} />
      <button type="button" onClick={() => form.setValue('name', '', {shouldDirty: true})}>
        empty-it
      </button>
      <button type="button" onClick={() => form.setValue('name', 'fixed', {shouldDirty: true})}>
        fix-it
      </button>
      <button
        type="button"
        onClick={() => form.setError('name', {type: 'server', message: 'taken'})}
      >
        server-error
      </button>
      <SaveButton />
    </FormProvider>
  );
};

const clickButton = (name: string) => fireEvent.click(screen.getByRole('button', {name}));
const saveButton = () => screen.getByRole('button', {name: 'ra.action.save'});

describe('SaveButton', () => {
  beforeEach(() => {
    save.mockClear();
    notify.mockClear();
  });

  it('does not submit while a field fails client-side validation', async () => {
    render(<Harness />);
    clickButton('empty-it');

    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('ra.message.invalid_form', {type: 'warning'})
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('submits once the value is valid again', async () => {
    render(<Harness />);
    clickButton('empty-it');
    fireEvent.click(saveButton());
    await waitFor(() => expect(notify).toHaveBeenCalled());

    clickButton('fix-it');
    fireEvent.click(saveButton());

    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toEqual({name: 'fixed'});
  });

  it('submits again after a server-side error, without the value changing', async () => {
    render(<Harness />);
    clickButton('fix-it');
    clickButton('server-error');

    fireEvent.click(saveButton());

    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(notify).not.toHaveBeenCalled();
  });

  it('stays enabled while an error is on screen, so a retry is possible', async () => {
    render(<Harness />);
    clickButton('empty-it');
    fireEvent.click(saveButton());

    await waitFor(() => expect(notify).toHaveBeenCalled());
    expect(saveButton()).not.toBeDisabled();
  });

  it('is disabled on a pristine form', () => {
    render(<Harness />);

    expect(saveButton()).toBeDisabled();
  });

  it('is enabled on a pristine form when the admin sets alwaysEnableSaveButton', async () => {
    const config: AdminConfig = {
      menu: {items: []},
      navigationGuard: false,
      draftEnabled: false,
      alwaysEnableSaveButton: true,
      defaultPerPage: 25,
      notificationAutoHideDuration: 10000,
    };
    render(
      <AdminConfigContext.Provider value={config}>
        <Harness />
      </AdminConfigContext.Provider>
    );

    expect(saveButton()).not.toBeDisabled();
    fireEvent.click(saveButton());

    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toEqual({name: 'ok'});
  });
});
