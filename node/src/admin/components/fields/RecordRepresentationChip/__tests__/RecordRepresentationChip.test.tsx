import React from 'react';
import {
  CoreAdminContext,
  RecordContextProvider,
  ResourceContextProvider,
  TestMemoryRouter,
} from 'react-admin';
import {describe, expect, it, vi} from 'vitest';
import {i18nProvider} from '@admin/pages/_i18n';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RecordRepresentationChip, RecordRepresentationChipProps} from '../RecordRepresentationChip';

// `useRecordLink` reaches for `useNavigate`, which resolves to a different react-router instance
// than the one `TestMemoryRouter` provides here. The rest of the module is kept — only navigation
// is stubbed, the same way `useRowClick`'s test does it.
const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

const dataProvider = {getList: () => Promise.resolve({data: [], total: 0})} as never;

const renderChip = (props: RecordRepresentationChipProps = {}) =>
  render(
    <TestMemoryRouter>
      <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
        <ResourceContextProvider value="owners">
          <RecordContextProvider value={{id: 1, name: 'Ada'}}>
            <RecordRepresentationChip {...props} />
          </RecordContextProvider>
        </ResourceContextProvider>
      </CoreAdminContext>
    </TestMemoryRouter>
  );

describe('RecordRepresentationChip', () => {
  // The tooltip has to follow the view that actually opens. It used to be derived from the
  // *requested* link instead, so a `link: true` falling back to `edit` still promised "Show".
  it('names the edit view when that is the view it opens', async () => {
    renderChip({viewType: 'edit'});

    await userEvent.hover(screen.getByRole('button'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Edit object');
  });

  it('names the show view when that is the view it opens', async () => {
    renderChip({viewType: 'show'});

    await userEvent.hover(screen.getByRole('button'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Show object');
  });

  it('renders an inert chip, with no tooltip, when there is no view to open', async () => {
    renderChip();

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
