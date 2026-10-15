import polyglotI18nProvider from 'ra-i18n-polyglot';
import React from 'react';
import {AdminContext as RaAdminContext, ResourceContextProvider} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {describe, expect, it, vi} from 'vitest';
import {FormShell} from '@admin/components/views/FormShell';
import {messages} from '@foundation/utils/locale';
import {SchemaRootContextState} from '@schema/contexts/SchemaRootContext/types';
import {SchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {defaultInputProvider} from '@schema/providers/defaultInputProvider';
import {defaultValidatorProvider} from '@schema/providers/defaultValidatorProvider';
import {AdminValidatorProvider} from '@schema/providers/types';
import {FieldSchema} from '@schema/types';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SchemaWriteonlyInputContent} from '../SchemaWriteonlyInputContent';

// End-to-end through the real chain: `FormShell` → `SimpleForm` → `SchemaWriteonlyInputContent` →
// `useSchemaValidators` → the real `defaultInputProvider` / `defaultValidatorProvider`, wired via a
// real `SchemaRootContext.Provider` carrying only the providers this path reads. The two
// layout-bound contexts `FormShell` reaches for (`AdminConfigContext` flags, the presentation
// portal) are the only things stubbed — they need the admin root / layout, which no form needs.
vi.mock('@admin/contexts/AdminConfigContext', () => ({
  useAdminConfig: () => ({navigationGuard: false, draftEnabled: false}),
}));
vi.mock('@admin/contexts/ViewPresentationContext', () => ({
  useViewPresentation: () => ({presentation: 'page', setBottomActions: () => undefined}),
}));

const i18nProvider = polyglotI18nProvider(() => messages.en, 'en');

const zipSchema: FieldSchema = {
  name: 'zip_code',
  type: 'string',
  label: 'ZIP code',
  options: {
    validators: [
      {type: 'max_length', value: 6},
      {type: 'regex', value: '^\\d{3} ?\\d{2}$', message: 'Enter a valid ZIP code.'},
    ],
  },
};

const renderForm = ({
  schema = zipSchema,
  onSubmit = vi.fn(),
  mode,
  validatorProvider,
}: {
  schema?: FieldSchema;
  onSubmit?: ReturnType<typeof vi.fn>;
  mode?: 'onBlur' | 'onSubmit';
  validatorProvider?: AdminValidatorProvider;
} = {}) => {
  const schemaRoot = {
    defaultInputProvider,
    defaultValidatorProvider,
    validatorProvider,
  } as unknown as SchemaRootContextState;

  render(
    <RaAdminContext i18nProvider={i18nProvider}>
      <SchemaRootContext.Provider value={schemaRoot}>
        <ResourceContextProvider value="company">
          <FormShell onSubmit={onSubmit as unknown as SubmitHandler<FieldValues>} mode={mode}>
            <SchemaWriteonlyInputContent schema={schema} />
          </FormShell>
        </ResourceContextProvider>
      </SchemaRootContext.Provider>
    </RaAdminContext>
  );
  return {onSubmit};
};

describe('schema validation in forms', () => {
  it('shows the schema validation error on blur, without submitting', async () => {
    const user = userEvent.setup();
    const {onSubmit} = renderForm();

    await user.type(screen.getByLabelText(/ZIP code/i), 'abc');
    await user.tab();

    expect(await screen.findByText('Enter a valid ZIP code.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears the error once the value is corrected', async () => {
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByLabelText(/ZIP code/i);
    await user.type(input, 'abc');
    await user.tab();
    expect(await screen.findByText('Enter a valid ZIP code.')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '123 45');
    await user.tab();
    await waitFor(() =>
      expect(screen.queryByText('Enter a valid ZIP code.')).not.toBeInTheDocument()
    );
  });

  it('blocks submit while a schema rule is violated', async () => {
    const user = userEvent.setup();
    const {onSubmit} = renderForm();

    await user.type(screen.getByLabelText(/ZIP code/i), 'abc');
    await user.click(screen.getByRole('button', {name: /submit/i}));

    expect(await screen.findByText('Enter a valid ZIP code.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when the value satisfies the schema rules', async () => {
    const user = userEvent.setup();
    const {onSubmit} = renderForm();

    await user.type(screen.getByLabelText(/ZIP code/i), '123 45');
    await user.click(screen.getByRole('button', {name: /submit/i}));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({zip_code: '123 45'});
  });

  it('combines required with schema validators', async () => {
    const user = userEvent.setup();
    const {onSubmit} = renderForm({schema: {...zipSchema, required: true}});

    await user.click(screen.getByRole('button', {name: /submit/i}));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('respects the onSubmit mode override (no validation on blur)', async () => {
    const user = userEvent.setup();
    renderForm({mode: 'onSubmit'});

    await user.type(screen.getByLabelText(/ZIP code/i), 'abc');
    await user.tab();

    await waitFor(() =>
      expect(screen.queryByText('Enter a valid ZIP code.')).not.toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', {name: /submit/i}));
    expect(await screen.findByText('Enter a valid ZIP code.')).toBeInTheDocument();
  });

  it('shows server-side errors returned from submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({zip_code: 'This ZIP code does not exist.'});
    renderForm({onSubmit});

    await user.type(screen.getByLabelText(/ZIP code/i), '123 45');
    await user.click(screen.getByRole('button', {name: /submit/i}));

    expect(await screen.findByText('This ZIP code does not exist.')).toBeInTheDocument();
  });

  it('applies a consumer validatorProvider that overrides a built-in rule', async () => {
    const user = userEvent.setup();
    const validatorProvider: AdminValidatorProvider = ({rule}) =>
      rule.type === 'max_length'
        ? (value) =>
            typeof value === 'string' && value.length > (rule.value as number)
              ? 'Way too long!'
              : undefined
        : undefined;
    const schema: FieldSchema = {
      name: 'code',
      type: 'string',
      label: 'Code',
      options: {validators: [{type: 'max_length', value: 3}]},
    };
    renderForm({schema, validatorProvider});

    await user.type(screen.getByLabelText(/Code/i), 'abcd');
    await user.tab();

    expect(await screen.findByText('Way too long!')).toBeInTheDocument();
  });
});
