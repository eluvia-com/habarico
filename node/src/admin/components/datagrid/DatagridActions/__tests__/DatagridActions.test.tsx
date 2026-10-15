import React from 'react';
import {
  CoreAdminContext,
  ListContextProvider,
  RaRecord,
  TestMemoryRouter,
  TextInput,
  useList,
} from 'react-admin';
import {describe, expect, it} from 'vitest';
import {ListConfigProvider} from '@admin/contexts/ListConfigContext';
import {i18nProvider} from '@admin/pages/_i18n';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DatagridActions} from '../DatagridActions';

const dataProvider = {
  getList: () => Promise.resolve({data: [], total: 0}),
} as never;

type HarnessProps = {columnSelector?: boolean; withFilters?: boolean; withInlineFilters?: boolean};

const filterInputs = [<TextInput key="name" source="name" label="Name" />];

const Harness = ({
  columnSelector = false,
  withFilters = false,
  withInlineFilters = false,
}: HarnessProps) => {
  const listContext = useList<RaRecord>({
    data: [],
    sort: {field: 'id', order: 'ASC'},
    filter: withFilters ? {name: 'Widget'} : undefined,
  });
  return (
    <ListContextProvider value={listContext}>
      <ListConfigProvider
        preferenceKey="owners.datagrid"
        sort={{field: 'id', order: 'ASC'}}
        filterDefaultValues={{}}
        filters={withFilters ? filterInputs : []}
        hasInlineFilters={withInlineFilters}
      >
        <DatagridActions columnSelector={columnSelector} />
      </ListConfigProvider>
    </ListContextProvider>
  );
};

const renderActions = (props: HarnessProps = {}) =>
  render(
    <TestMemoryRouter>
      <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
        {/* The filter panel (`InspectorPanel`) reads the app theme's custom tokens. */}
        <ThemeProvider theme={createLightTheme()}>
          <Harness {...props} />
        </ThemeProvider>
      </CoreAdminContext>
    </TestMemoryRouter>
  );

describe('DatagridActions ⋮ more menu', () => {
  it('collapses the secondary config actions behind a "more" button', async () => {
    renderActions();
    const more = await screen.findByRole('button', {name: 'More actions'});
    // The secondary reset actions are not in the DOM until the menu opens.
    expect(screen.queryByText('Reset sorting')).not.toBeInTheDocument();

    await userEvent.click(more);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', {name: 'Reset sorting'})).toBeInTheDocument();
      expect(screen.getByRole('menuitem', {name: 'Reset table settings'})).toBeInTheDocument();
    });
  });

  it('includes the column selector in the menu when enabled', async () => {
    renderActions({columnSelector: true});
    await userEvent.click(await screen.findByRole('button', {name: 'More actions'}));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', {name: 'Select columns'})).toBeInTheDocument()
    );
  });

  it('offers no filter reset when the list has no filters', async () => {
    renderActions();
    await userEvent.click(await screen.findByRole('button', {name: 'More actions'}));
    await screen.findByRole('menuitem', {name: 'Reset sorting'});
    expect(screen.queryByRole('menuitem', {name: 'Reset filters'})).not.toBeInTheDocument();
  });

  it('offers the filter reset when the list has only inline toolbar filters', async () => {
    renderActions({withInlineFilters: true});
    await userEvent.click(await screen.findByRole('button', {name: 'More actions'}));
    expect(await screen.findByRole('menuitem', {name: 'Reset filters'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Open filters'})).not.toBeInTheDocument();
  });

  it('lists the filter reset right above the sort reset when the list has filters', async () => {
    renderActions({withFilters: true});
    await userEvent.click(await screen.findByRole('button', {name: 'More actions'}));
    const items = await screen.findAllByRole('menuitem');
    const names = items.map((item) => item.textContent);
    expect(names.indexOf('Reset filters')).toBe(names.indexOf('Reset sorting') - 1);
  });
});

// The panel is portalled into an MUI `Backdrop`, which marks itself `aria-hidden` — role queries
// inside it need `hidden: true`.
describe('DatagridActions filter panel', () => {
  it('shows the filter reset in the panel footer instead of the table-settings reset', async () => {
    renderActions({withFilters: true});
    await userEvent.click(await screen.findByRole('button', {name: 'Open filters'}));

    expect(
      await screen.findByRole('button', {name: 'Reset filters', hidden: true})
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {name: 'Reset table settings', hidden: true})
    ).not.toBeInTheDocument();
  });

  it('resets just the filters from the panel footer', async () => {
    renderActions({withFilters: true});
    await userEvent.click(await screen.findByRole('button', {name: 'Open filters'}));
    expect(await screen.findByDisplayValue('Widget')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'Reset filters', hidden: true}));

    await waitFor(() => expect(screen.queryByDisplayValue('Widget')).not.toBeInTheDocument());
  });
});
