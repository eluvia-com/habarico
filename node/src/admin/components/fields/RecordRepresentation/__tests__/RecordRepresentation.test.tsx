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
import {RecordRepresentation, RecordRepresentationProps} from '../RecordRepresentation';

// `useRecordLink` reaches for `useNavigate`, which resolves to a different react-router instance
// than the one `TestMemoryRouter` provides here. The rest of the module is kept — only navigation
// is stubbed, the same way `useRowClick`'s test does it.
const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

const dataProvider = {getList: () => Promise.resolve({data: [], total: 0})} as never;

const renderRepresentation = (props: RecordRepresentationProps = {}) =>
  render(
    <TestMemoryRouter>
      <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
        <ResourceContextProvider value="owners">
          <RecordContextProvider value={{id: 1, name: 'Ada'}}>
            <RecordRepresentation {...props} />
          </RecordContextProvider>
        </ResourceContextProvider>
      </CoreAdminContext>
    </TestMemoryRouter>
  );

describe('RecordRepresentation', () => {
  describe('chip variant', () => {
    // The tooltip has to follow the view that actually opens. It used to be derived from the
    // *requested* link instead, so a `link: true` falling back to `edit` still promised "Show".
    it('names the edit view when that is the view it opens', async () => {
      renderRepresentation({viewType: 'edit'});

      await userEvent.hover(screen.getByRole('button'));

      expect(await screen.findByRole('tooltip')).toHaveTextContent('Edit object');
    });

    it('names the show view when that is the view it opens', async () => {
      renderRepresentation({viewType: 'show'});

      await userEvent.hover(screen.getByRole('button'));

      expect(await screen.findByRole('tooltip')).toHaveTextContent('Show object');
    });

    it('renders an inert chip, with no tooltip, when there is no view to open', async () => {
      renderRepresentation();

      expect(screen.queryByRole('button')).toBeNull();
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('is the variant a caller gets without asking for one', async () => {
      renderRepresentation({viewType: 'show'});

      // The chip's icon and tooltip are what separate it from the text link.
      await userEvent.hover(screen.getByRole('button'));

      expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('link variant', () => {
    it('renders the record representation', () => {
      renderRepresentation({variant: 'link', viewType: 'show'});

      expect(screen.getByText('Ada')).toBeInTheDocument();
    });

    it('opens the record when clicked', async () => {
      navigate.mockClear();
      renderRepresentation({variant: 'link', viewType: 'show'});

      await userEvent.click(screen.getByText('Ada'));

      expect(navigate).toHaveBeenCalled();
    });

    // The affordance is the colour and the hover underline, nothing else — unlike the chip, which
    // also names the view it opens in a tooltip.
    it('offers no action tooltip', async () => {
      renderRepresentation({variant: 'link', viewType: 'edit'});

      await userEvent.hover(screen.getByText('Ada'));

      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('renders inert text, with no click target, when there is no view to open', async () => {
      navigate.mockClear();
      renderRepresentation({variant: 'link'});

      await userEvent.click(screen.getByText('Ada'));

      expect(navigate).not.toHaveBeenCalled();
    });

    // `EllipsisWithTitle` would otherwise fall back to its own 200px default and truncate a link
    // the caller never asked to cap.
    it('caps at the container width when the caller passes no maxWidth', () => {
      const {container} = renderRepresentation({variant: 'link', viewType: 'show'});

      expect(container.querySelector('.MuiBox-root')).toHaveStyle({maxWidth: '100%'});
    });

    // Without these the link is a clickable span: unreachable by keyboard, and invisible to the
    // datagrid's "is the pointer on a control that owns its click?" test, which is what keeps the
    // row hint from stacking on top of it.
    it('exposes itself as a button when it links somewhere', () => {
      renderRepresentation({variant: 'link', viewType: 'show'});

      expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
    });

    it('is not a button when there is nothing to open', () => {
      renderRepresentation({variant: 'link'});

      expect(screen.queryByRole('button')).toBeNull();
    });

    it('opens the record from the keyboard', async () => {
      navigate.mockClear();
      renderRepresentation({variant: 'link', viewType: 'show'});

      screen.getByRole('button').focus();
      await userEvent.keyboard('{Enter}');

      expect(navigate).toHaveBeenCalled();
    });
  });
});
