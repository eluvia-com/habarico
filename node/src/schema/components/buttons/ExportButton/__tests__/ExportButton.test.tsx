import React from 'react';
import {ListContext, ResourceContextProvider} from 'react-admin';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ParentResourceDescriptorsProvider} from '@schema/contexts/ParentResourceDescriptorsContext';
import {ResourceDescriptor} from '@schema/contexts/ParentResourceDescriptorsContext/types';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ExportButton} from '../ExportButton';

const h = vi.hoisted(() => ({
  listContext: {} as Record<string, unknown>,
  exporterMock: vi.fn(),
  useExporterMock: vi.fn(),
  notifyMock: vi.fn(),
}));

vi.mock('react-admin', async () => {
  const actual = await vi.importActual<typeof import('react-admin')>('react-admin');
  return {
    ...actual,
    useNotify: () => h.notifyMock,
    useTranslate: () => (key: string) => key,
  };
});

vi.mock('@schema/hooks/useExporter', () => ({
  useExporter: h.useExporterMock,
}));

// The presentation wrapper needs react-admin store/theme contexts and is not under test
vi.mock('@admin/components/buttons/ActionButton', () => ({
  ActionButton: ({
    onClick,
    loading,
    label,
  }: {
    onClick: () => void;
    loading?: boolean;
    label?: string;
  }) => (
    <button disabled={loading} onClick={onClick}>
      {label}
    </button>
  ),
}));

const buildListContext = (overrides: Record<string, unknown> = {}) => ({
  resource: 'blog/articles',
  filter: undefined,
  filterValues: {},
  sort: {field: 'id', order: 'ASC'},
  selectedIds: [],
  ...overrides,
});

// The button inside the list of `blog/articles`, or outside any list when `list` is false.
const renderButton = (
  element: React.ReactElement,
  {list = true, parents = []}: {list?: boolean; parents?: ResourceDescriptor[]} = {}
) =>
  render(
    <ResourceContextProvider value="blog/articles">
      <ParentResourceDescriptorsProvider value={parents}>
        {list ? (
          <ListContext.Provider value={h.listContext as never}>{element}</ListContext.Provider>
        ) : (
          element
        )}
      </ParentResourceDescriptorsProvider>
    </ResourceContextProvider>
  );

describe('ExportButton', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exports the selected records when rows are selected', async () => {
    h.useExporterMock.mockReturnValue(h.exporterMock);
    h.exporterMock.mockResolvedValue(undefined);
    h.listContext = buildListContext({selectedIds: [1, 2]});

    renderButton(<ExportButton format="csv" fields={['name', 'price']} />);
    await userEvent.click(screen.getByRole('button', {name: 'ra.action.export'}));

    expect(h.useExporterMock).toHaveBeenCalledWith('blog/articles');
    await waitFor(() =>
      expect(h.exporterMock).toHaveBeenCalledWith({
        format: 'csv',
        fields: ['name', 'price'],
        ids: [1, 2],
      })
    );
  });

  it('exports by current filters and sort when nothing is selected', async () => {
    h.useExporterMock.mockReturnValue(h.exporterMock);
    h.exporterMock.mockResolvedValue(undefined);
    h.listContext = buildListContext({
      filter: {is_active: true},
      filterValues: {name: 'x'},
      sort: {field: 'title', order: 'DESC'},
    });

    renderButton(<ExportButton format="csv" />);
    await userEvent.click(screen.getByRole('button', {name: 'ra.action.export'}));

    await waitFor(() =>
      expect(h.exporterMock).toHaveBeenCalledWith({
        format: 'csv',
        fields: undefined,
        filter: {name: 'x', is_active: true},
        sort: {field: 'title', order: 'DESC'},
      })
    );
  });

  it('defaults to the csv format', async () => {
    h.useExporterMock.mockReturnValue(h.exporterMock);
    h.exporterMock.mockResolvedValue(undefined);
    h.listContext = buildListContext();

    renderButton(<ExportButton />);
    await userEvent.click(screen.getByRole('button', {name: 'ra.action.export'}));

    await waitFor(() =>
      expect(h.exporterMock).toHaveBeenCalledWith(expect.objectContaining({format: 'csv'}))
    );
  });

  it('shows an error notification when the export fails', async () => {
    h.useExporterMock.mockReturnValue(h.exporterMock);
    h.exporterMock.mockRejectedValue(new Error('boom'));
    h.listContext = buildListContext();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderButton(<ExportButton />);
    await userEvent.click(screen.getByRole('button', {name: 'ra.action.export'}));

    await waitFor(() =>
      expect(h.notifyMock).toHaveBeenCalledWith('ra.notification.http_error', {type: 'error'})
    );
    consoleError.mockRestore();
  });

  describe('outside the list of its resource', () => {
    const run = async (options: Parameters<typeof renderButton>[1]) => {
      h.useExporterMock.mockReturnValue(h.exporterMock);
      h.exporterMock.mockResolvedValue(undefined);
      h.listContext = buildListContext({selectedIds: [1, 2], filterValues: {name: 'x'}});
      renderButton(<ExportButton format="csv" />, options);
      await userEvent.click(screen.getByRole('button', {name: 'ra.action.export'}));
    };

    it('exports every record of the parent it is linked to', async () => {
      await run({list: false, parents: [{resource: 'blog/blogs', recordId: 7, target: 'blog'}]});

      await waitFor(() =>
        expect(h.exporterMock).toHaveBeenCalledWith({
          format: 'csv',
          fields: undefined,
          filter: {blog: 7},
        })
      );
    });

    it('exports every record of its resource when linked to no parent', async () => {
      await run({list: false});

      await waitFor(() =>
        expect(h.exporterMock).toHaveBeenCalledWith({format: 'csv', fields: undefined, filter: {}})
      );
    });

    it('ignores the table state of a list of another resource around it', async () => {
      h.listContext = buildListContext({resource: 'blog/comments', selectedIds: [1]});
      h.useExporterMock.mockReturnValue(h.exporterMock);
      h.exporterMock.mockResolvedValue(undefined);
      renderButton(<ExportButton format="csv" />);
      await userEvent.click(screen.getByRole('button', {name: 'ra.action.export'}));

      await waitFor(() =>
        expect(h.exporterMock).toHaveBeenCalledWith({format: 'csv', fields: undefined, filter: {}})
      );
    });
  });
});
