import React from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
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
    useListContext: () => h.listContext,
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

describe('ExportButton', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exports the selected records when rows are selected', async () => {
    h.useExporterMock.mockReturnValue(h.exporterMock);
    h.exporterMock.mockResolvedValue(undefined);
    h.listContext = buildListContext({selectedIds: [1, 2]});

    render(<ExportButton format="csv" fields={['name', 'price']} />);
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

    render(<ExportButton format="csv" />);
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

    render(<ExportButton />);
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

    render(<ExportButton />);
    await userEvent.click(screen.getByRole('button', {name: 'ra.action.export'}));

    await waitFor(() =>
      expect(h.notifyMock).toHaveBeenCalledWith('ra.notification.http_error', {type: 'error'})
    );
    consoleError.mockRestore();
  });
});
