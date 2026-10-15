import polyglotI18nProvider from 'ra-i18n-polyglot';
import React from 'react';
import {
  Form,
  AdminContext as RaAdminContext,
  ResourceContextProvider,
  TextInput,
} from 'react-admin';
import {useWatch} from 'react-hook-form';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ThemeProvider} from '@design/theme';
import {enMessages} from '@foundation/utils/locale/en';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FormArrayInput} from '../FormArrayInput';

// Removing a row shifts every row below it onto a lower index. React Hook Form re-indexes the
// values but not the *defaults*, and resolves an unset value as
// `get(values, name, get(defaultValues, name))` — so a field the user left empty used to be
// back-filled from whatever the record carried at that position, i.e. from the deleted row
// (HAB-837). These tests pin the values the form actually submits after a removal.

const i18nProvider = polyglotI18nProvider(() => enMessages, 'en');

const FormValues = () => {
  const parts = useWatch({name: 'parts'});
  return <output data-testid={'values'}>{JSON.stringify(parts)}</output>;
};

const renderForm = (parts: {type: string; note?: string}[]) => {
  render(
    <RaAdminContext i18nProvider={i18nProvider}>
      {/* The row card reads the design palette (`background.neutral`, channel tokens), which React
          Admin's default MUI theme does not carry. */}
      <ThemeProvider>
        <ResourceContextProvider value={'products'}>
          <Form record={{id: 1, parts}} onSubmit={() => undefined}>
            <FormArrayInput source={'parts'}>
              <TextInput source={'type'} />
              <TextInput source={'note'} />
            </FormArrayInput>
            <FormValues />
          </Form>
        </ResourceContextProvider>
      </ThemeProvider>
    </RaAdminContext>
  );
  return () => JSON.parse(screen.getByTestId('values').textContent || 'null');
};

// jsdom has no layout, so every box measures 0 — and a `FormTable` row with no box to measure hides
// its content rather than guess whether its cells fit side by side. Give the rows a wide box so
// these tests see a laid-out, inline table.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 1024, 40)
  );
});

afterEach(() => vi.restoreAllMocks());

describe('FormArrayInput row removal', () => {
  it('does not move a value from the removed row onto the row that takes its index', async () => {
    const user = userEvent.setup();
    const values = renderForm([
      {type: 'Screw', note: 'left over'},
      {type: 'Nut'}, // no note — the empty field the stale default used to land in
      {type: 'Bolt', note: 'keep me'},
    ]);

    await user.click(screen.getAllByRole('button', {name: /remove/i})[0]);

    expect(values()).toEqual([{type: 'Nut'}, {type: 'Bolt', note: 'keep me'}]);
  });

  it('keeps the remaining rows intact when the removed row is the last one', async () => {
    const user = userEvent.setup();
    const values = renderForm([{type: 'Screw', note: 'keep me'}, {type: 'Nut'}]);

    await user.click(screen.getAllByRole('button', {name: /remove/i})[1]);

    expect(values()).toEqual([{type: 'Screw', note: 'keep me'}]);
  });
});
