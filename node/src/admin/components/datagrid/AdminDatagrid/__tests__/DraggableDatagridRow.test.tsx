import React from 'react';
import {
  CoreAdminContext,
  ListContextProvider,
  RaRecord,
  ResourceContextProvider,
  useList,
} from 'react-admin';
import {MemoryRouter} from 'react-router';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {TextField} from '@admin/components/fields/TextField';
import {i18nProvider} from '@admin/pages/_i18n';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {AdminDatagrid} from '../AdminDatagrid';

const RECORDS = ['Red', 'Green', 'Blue', 'Yellow', 'Black'].map((name, i) => ({
  id: i + 1,
  name,
  index: i + 1,
}));

const dataProvider = {
  getList: () => Promise.resolve({data: [], total: 0}),
} as never;

type OnDropRow = (record: RaRecord, index: number) => void;
type SortOrder = 'ASC' | 'DESC';

const Harness = ({onDropRow, order}: {onDropRow: OnDropRow; order: SortOrder}) => {
  const listContext = useList({data: RECORDS, sort: {field: 'index', order}});
  return (
    <ListContextProvider value={listContext}>
      <AdminDatagrid bulkActionButtons={false} enableDnd onDropRow={onDropRow}>
        <TextField source="name" />
      </AdminDatagrid>
    </ListContextProvider>
  );
};

const renderGrid = (onDropRow: OnDropRow, order: SortOrder = 'ASC') =>
  render(
    <MemoryRouter>
      <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
        <ThemeProvider theme={createLightTheme()}>
          <ResourceContextProvider value="colors">
            <Harness onDropRow={onDropRow} order={order} />
          </ResourceContextProvider>
        </ThemeProvider>
      </CoreAdminContext>
    </MemoryRouter>
  );

const rowOf = (name: string) => screen.getByText(name).closest('tr')!;

const handleOf = (name: string) =>
  within(rowOf(name)).getByLabelText(i18nProvider.translate('ra.action.drag_to_reorder'));

const renderedOrder = () =>
  Array.from(rowOf('Red').closest('tbody')!.rows).map((row) => row.textContent);

// jsdom has no layout, so each move event names the row under the pointer explicitly.
const dragOver = (rowNames: string[]) => {
  rowNames.forEach((name, i) => {
    document.elementFromPoint = vi.fn(() => rowOf(name));
    fireEvent.mouseMove(document, {clientX: 10, clientY: 100 + i});
  });
};

describe('DraggableDatagridRow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports the index of the place the row is released on after changing direction', () => {
    const onDropRow = vi.fn();
    renderGrid(onDropRow);

    fireEvent.mouseDown(handleOf('Black'), {button: 0, clientX: 10, clientY: 10});
    dragOver(['Yellow', 'Blue', 'Green', 'Red', 'Red', 'Green']);
    fireEvent.mouseUp(document, {clientX: 10, clientY: 200});

    expect(renderedOrder()).toEqual(['Red', 'Green', 'Black', 'Blue', 'Yellow']);
    expect(onDropRow).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({id: 5}), 3);
  });

  it('reports the index of the place the row is released on when dragged down', () => {
    const onDropRow = vi.fn();
    renderGrid(onDropRow);

    fireEvent.mouseDown(handleOf('Red'), {button: 0, clientX: 10, clientY: 10});
    dragOver(['Green', 'Blue']);
    fireEvent.mouseUp(document, {clientX: 10, clientY: 200});

    expect(renderedOrder()).toEqual(['Green', 'Blue', 'Red', 'Yellow', 'Black']);
    expect(onDropRow).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({id: 1}), 3);
  });

  it('reports the index of the place the row is released on in a descending list', () => {
    const onDropRow = vi.fn();
    renderGrid(onDropRow, 'DESC');

    fireEvent.mouseDown(handleOf('Red'), {button: 0, clientX: 10, clientY: 10});
    dragOver(['Green', 'Blue', 'Yellow', 'Black']);
    fireEvent.mouseUp(document, {clientX: 10, clientY: 200});

    expect(renderedOrder()).toEqual(['Red', 'Black', 'Yellow', 'Blue', 'Green']);
    expect(onDropRow).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({id: 1}), 5);
  });

  it('does not report a drop back on the starting place', () => {
    const onDropRow = vi.fn();
    renderGrid(onDropRow);

    fireEvent.mouseDown(handleOf('Blue'), {button: 0, clientX: 10, clientY: 10});
    dragOver(['Green', 'Green']);
    fireEvent.mouseUp(document, {clientX: 10, clientY: 200});

    expect(onDropRow).not.toHaveBeenCalled();
  });
});
