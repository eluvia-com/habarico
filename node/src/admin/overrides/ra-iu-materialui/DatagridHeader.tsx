// @ts-nocheck
import clsx from 'clsx';
import {Identifier, RaRecord, SortPayload, useListContextWithProps, useTranslate} from 'ra-core';
import * as React from 'react';
import {Children, FC, ReactElement, isValidElement, useCallback} from 'react';
import {DatagridClasses, useDatagridContext} from 'react-admin';
import {Checkbox, TableCell, TableHead, TableRow} from '@mui/material';
import {
  DatagridHeaderActionElementProps,
  DatagridHeaderCell,
  DatagridHeaderCellProps,
} from './DatagridHeaderCell';
import ExpandAllButton from './ExpandAllButton';

/**
 * The default Datagrid Header component.
 *
 * Renders select all checkbox as well as column header buttons used for sorting.
 */
export const DatagridHeader = (props: DatagridHeaderProps) => {
  const {
    children,
    className,
    hasExpand = false,
    hasBulkActions = false,
    isRowSelectable,
    CellComponent = DatagridHeaderCell,
    action,
  } = props;
  const translate = useTranslate();
  const {sort, data, onSelect, selectedIds, setSort} = useListContextWithProps(props);
  const {expandSingle} = useDatagridContext();

  const updateSortCallback = useCallback(
    (event) => {
      event.stopPropagation();
      if (!setSort) return;
      const newField = event.currentTarget.dataset.field;
      const sameFieldOrder = sort?.order === 'ASC' ? 'DESC' : 'ASC';
      const newOrder =
        sort?.field === newField ? sameFieldOrder : event.currentTarget.dataset.order;
      setSort({field: newField, order: newOrder});
    },
    [sort?.field, sort?.order, setSort]
  );

  const updateSort = setSort ? updateSortCallback : null;

  const handleSelectAll = useCallback(
    (event) => {
      if (!onSelect || !selectedIds || !data) return;
      onSelect(
        event.target.checked
          ? selectedIds.concat(
              data
                .filter((record) => !selectedIds.includes(record.id))
                .filter((record) => (isRowSelectable ? isRowSelectable(record) : true))
                .map((record) => record.id)
            )
          : []
      );
    },
    [data, onSelect, isRowSelectable, selectedIds]
  );

  const allIds = Array.isArray(data) ? data.map((record) => record.id) : [];
  const selectableIds =
    Array.isArray(data) && isRowSelectable
      ? data.filter((record) => isRowSelectable(record)).map((record) => record.id)
      : allIds;

  return (
    <TableHead className={clsx(className, DatagridClasses.thead)}>
      <TableRow className={clsx(DatagridClasses.row, DatagridClasses.headerRow)}>
        {hasExpand && (
          <TableCell
            padding="none"
            className={clsx(DatagridClasses.headerCell, DatagridClasses.expandHeader)}
          >
            {!expandSingle && data ? (
              <ExpandAllButton ids={data.map((record) => record.id)} />
            ) : null}
          </TableCell>
        )}
        {hasBulkActions && selectedIds && (
          <TableCell padding="checkbox" className={DatagridClasses.headerCell}>
            <Checkbox
              inputProps={{
                'aria-label': translate('ra.action.select_all', {_: 'Select all'}),
              }}
              className="select-all"
              color="primary"
              checked={
                selectedIds.length > 0 &&
                selectableIds.length > 0 &&
                selectableIds.every((id) => selectedIds.includes(id))
              }
              onChange={handleSelectAll}
              onClick={(e) => e.stopPropagation()}
            />
          </TableCell>
        )}
        {Children.map(children, (field, index) =>
          isValidElement(field) ? (
            <CellComponent
              className={clsx(
                DatagridClasses.headerCell,
                `column-${(field.props as {source?: string; sortBy?: string}).source}`
              )}
              sort={sort}
              field={field}
              isSorting={
                sort?.field ===
                ((field.props as {source?: string; sortBy?: string}).sortBy ||
                  (field.props as {source?: string; sortBy?: string}).source)
              }
              key={(field.props as {source?: string; sortBy?: string}).source || index}
              updateSort={updateSort || undefined}
              action={action}
            />
          ) : null
        )}
      </TableRow>
    </TableHead>
  );
};

export interface DatagridHeaderProps<RecordType extends RaRecord = RaRecord> {
  children?: React.ReactNode;
  className?: string;
  hasExpand?: boolean;
  hasBulkActions?: boolean;
  isRowSelectable?: (record: RecordType) => boolean;
  isRowExpandable?: (record: RecordType) => boolean;
  size?: 'medium' | 'small';
  // can be injected when using the component without context
  sort?: SortPayload;
  data?: RecordType[];
  onSelect?: (ids: Identifier[]) => void;
  onToggleItem?: (id: Identifier) => void;
  selectedIds?: Identifier[];
  setSort?: (sort: SortPayload) => void;
  action?: ReactElement<DatagridHeaderActionElementProps>;
  CellComponent?: FC<DatagridHeaderCellProps>;
}

DatagridHeader.displayName = 'DatagridHeader';
