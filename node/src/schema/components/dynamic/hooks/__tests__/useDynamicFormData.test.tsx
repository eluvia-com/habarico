import polyglotI18nProvider from 'ra-i18n-polyglot';
import React from 'react';
import {Form, AdminContext as RaAdminContext, SourceContextProvider} from 'react-admin';
import {useFormContext} from 'react-hook-form';
import {describe, expect, it, vi} from 'vitest';
import {enMessages} from '@foundation/utils/locale/en';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useDynamicFormData} from '../useDynamicFormData';

// `useSchemaViewRouterContext` pulls in react-router/react-admin resource plumbing this test has no
// use for — stubbed the same way `SchemaInput.dynamic.test.tsx` stubs the read-only counterpart.
vi.mock('@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext', () => ({
  useSchemaViewRouterContext: () => ({data: {}}),
}));

const i18nProvider = polyglotI18nProvider(() => enMessages, 'en');

// Spies, not a mutated counter object: the render body only ever *calls* these, it never assigns to
// an outer-scope binding, which is what `react-hooks/immutability` forbids in a component/hook body.
const companyRenders = vi.fn();
const countryRenders = vi.fn();

const RegisteredInput = ({source}: {source: string}) => {
  const {register} = useFormContext();
  return <input aria-label={source} {...register(source)} />;
};

const CompanyCondition = () => {
  companyRenders();
  const {data} = useDynamicFormData(['data.is_company == true']);
  return <output data-testid="company-condition">{String(Boolean(data?.is_company))}</output>;
};

const CountryCondition = () => {
  countryRenders();
  const {data} = useDynamicFormData(['data.country == "DE"']);
  return <output data-testid="country-condition">{String(data?.country === 'DE')}</output>;
};

const setup = () => {
  render(
    <RaAdminContext i18nProvider={i18nProvider}>
      <Form
        record={{is_company: false, country: 'US', notes: ''}}
        onSubmit={() => undefined}
        mode="onChange"
      >
        <RegisteredInput source="notes" />
        <RegisteredInput source="country" />
        <RegisteredInput source="is_company" />
        <CompanyCondition />
        <CountryCondition />
      </Form>
    </RaAdminContext>
  );
};

// This is the regression the "large form re-renders on every keystroke" complaint (HAB-975) comes
// down to: before scoping, every `dynamicRender` condition watched the whole form, so typing into
// *any* field re-rendered *every* condition. These assertions prove a condition now only reacts to
// the field(s) its own query actually reads.
describe('useDynamicFormData — scoped watching', () => {
  it('does not re-render any condition when an unrelated field changes', async () => {
    const user = userEvent.setup();
    setup();
    companyRenders.mockClear();
    countryRenders.mockClear();

    await user.type(screen.getByLabelText('notes'), 'hello');

    expect(companyRenders).not.toHaveBeenCalled();
    expect(countryRenders).not.toHaveBeenCalled();
  });

  it('re-renders only the condition that reads the field being typed into', async () => {
    const user = userEvent.setup();
    setup();
    companyRenders.mockClear();
    countryRenders.mockClear();

    await user.type(screen.getByLabelText('country'), 'X');

    expect(countryRenders).toHaveBeenCalled();
    expect(companyRenders).not.toHaveBeenCalled();
  });

  it('still evaluates correctly once the watched field reaches the matching value', async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByTestId('country-condition')).toHaveTextContent('false');

    await user.clear(screen.getByLabelText('country'));
    await user.type(screen.getByLabelText('country'), 'DE');

    expect(screen.getByTestId('country-condition')).toHaveTextContent('true');
  });
});

// `parent.` can't be resolved to a concrete field path (see `getConditionDependencies`), so this
// falls back to a full-form watch instead of a scoped one — no existing schema/story exercises it,
// so this is the only coverage of the fallback actually still producing correct data.
const ParentCondition = () => {
  const {parent} = useDynamicFormData(['parent.data.country == "DE"']);
  return <output data-testid="parent-country">{String(parent?.data?.country)}</output>;
};

describe('useDynamicFormData — parent. fallback', () => {
  it('still resolves the ancestor scope correctly when a condition references parent.', () => {
    render(
      <RaAdminContext i18nProvider={i18nProvider}>
        <Form record={{country: 'DE', address: {city: 'Berlin'}}} onSubmit={() => undefined}>
          <SourceContextProvider
            value={{
              getSource: (source) => (source ? `address.${source}` : 'address'),
              getLabel: (source) => source,
            }}
          >
            <ParentCondition />
          </SourceContextProvider>
        </Form>
      </RaAdminContext>
    );

    expect(screen.getByTestId('parent-country')).toHaveTextContent('DE');
  });
});
