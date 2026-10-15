import React, {Profiler} from 'react';
import {
  CoreAdminContext,
  Form,
  FormGroupContextProvider,
  I18nProvider,
  TestMemoryRouter,
  required,
} from 'react-admin';
import {beforeEach, describe, expect, it} from 'vitest';
import {TextInput} from '@admin/components/inputs/TextInput';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {FormStatusLabel} from '../FormStatusLabel';

// ---------------------------------------------------------------------------
// Harness — two form groups, each with one required input and one label, which is
// the shape that matters: the label must react to its own group and to nothing else.
// The tooltip title reaches the DOM as MUI's `aria-label`, so the dot's state is
// queryable the way a screen reader sees it.
// ---------------------------------------------------------------------------

const TRANSLATIONS: Record<string, string> = {
  'ra.form.tab_errors': 'This tab has errors',
  'ra.form.tab_unsaved': 'This tab has unsaved changes',
};

const i18nProvider = {
  translate: (key: string) => TRANSLATIONS[key] ?? key,
  changeLocale: () => Promise.resolve(),
  getLocale: () => 'en',
} as unknown as I18nProvider;

let commits = 0;
const countCommit = () => {
  commits += 1;
};

const Harness = ({countedGroup}: {countedGroup?: string}) => (
  <TestMemoryRouter initialEntries={['/']}>
    <CoreAdminContext i18nProvider={i18nProvider}>
      {/* `onChange` is what the form behaves like once a save has been attempted. */}
      <Form mode="onChange">
        {['details', 'shipping'].map((group) => (
          <FormGroupContextProvider key={group} name={group}>
            {group === countedGroup ? (
              <Profiler id={group} onRender={countCommit}>
                <FormStatusLabel groupName={group}>{group}</FormStatusLabel>
              </Profiler>
            ) : (
              <FormStatusLabel groupName={group}>{group}</FormStatusLabel>
            )}
            <TextInput source={group} label={group} validate={required()} helperText={false} />
          </FormGroupContextProvider>
        ))}
      </Form>
    </CoreAdminContext>
  </TestMemoryRouter>
);

const input = (group: string) => screen.getByLabelText(group, {exact: false, selector: 'input'});

// Typing and clearing leaves the field dirty and failing its `required` rule.
const breakField = (group: string) => {
  fireEvent.change(input(group), {target: {value: 'Gift wrap'}});
  fireEvent.change(input(group), {target: {value: ''}});
};

const errorLabel = () => screen.queryByLabelText(TRANSLATIONS['ra.form.tab_errors']);

beforeEach(() => {
  commits = 0;
});

describe('FormStatusLabel', () => {
  it('flags an error in its own group', async () => {
    render(<Harness />);
    expect(errorLabel()).toBeNull();

    breakField('details');

    await waitFor(() => expect(errorLabel()).not.toBeNull());
    expect(errorLabel()).toHaveTextContent('details');
  });

  it('stays neutral while the error is in another group', async () => {
    render(<Harness />);

    breakField('details');

    await waitFor(() => expect(errorLabel()).not.toBeNull());
    // Only one label carries the error name — the other group's is untouched.
    expect(screen.queryAllByLabelText(TRANSLATIONS['ra.form.tab_errors'])).toHaveLength(1);
  });

  it("does not re-render when another group's field changes", async () => {
    render(<Harness countedGroup="shipping" />);
    // React Admin's Form resets itself on mount; settle before counting.
    await waitFor(() => expect(commits).toBeGreaterThan(0));
    const before = commits;

    breakField('details');

    await waitFor(() => expect(errorLabel()).not.toBeNull());
    expect(commits).toBe(before);

    breakField('shipping');

    await waitFor(() => expect(commits).toBeGreaterThan(before));
  });
});
