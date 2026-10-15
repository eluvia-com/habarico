// @ts-nocheck
/* eslint-disable */
import clsx from 'clsx';
import {FieldTitle, type SortPayload, useResourceContext, useTranslateLabel} from 'ra-core';
import * as React from 'react';
import {ReactElement, memo} from 'react';
import {useTranslate} from 'react-admin';
import {Box, TableCell, type TableCellProps, TableSortLabel, Tooltip} from '@mui/material';
import {type ComponentsOverrides, styled, useThemeProps} from '@mui/material/styles';

const oppositeOrder: Record<SortPayload['order'], SortPayload['order']> = {
  ASC: 'DESC',
  DESC: 'ASC',
};

export const DatagridHeaderCell = (inProps: DatagridHeaderCellProps) => {
  const props = useThemeProps({
    props: inProps,
    name: PREFIX,
  });
  const {className, field, sort, updateSort, isSorting, action, ...rest} = props;
  const resource = useResourceContext();

  const translate = useTranslate();
  const translateLabel = useTranslateLabel();
  const nextSortOrder = field
    ? sort && sort.field === (field.props.sortBy || field.props.source)
      ? // active sort field, use opposite order
        oppositeOrder[sort.order]
      : // non active sort field, use default order
        (field?.props.sortByOrder ?? 'ASC')
    : undefined;
  const fieldLabel = field
    ? translateLabel({
        label: typeof field.props.label === 'string' ? field.props.label : undefined,
        resource,
        source: field.props.source,
      })
    : undefined;
  const sortLabel = translate('ra.sort.sort_by', {
    field: fieldLabel,
    field_lower_first:
      typeof fieldLabel === 'string'
        ? fieldLabel.charAt(0).toLowerCase() + fieldLabel.slice(1)
        : undefined,
    order: translate(`ra.sort.${nextSortOrder}`),
    _: translate('ra.action.sort'),
  });

  const actionEl = action
    ? React.cloneElement(action, {
        field,
      })
    : null;

  return (
    <StyledTableCell
      className={clsx(className, field?.props.headerClassName)}
      align={field?.props.textAlign || field?.type.textAlign}
      variant="head"
      {...rest}
    >
      {updateSort &&
      sort &&
      field &&
      field.props.sortable !== false &&
      field.type.sortable !== false &&
      (field.props.sortBy || field.props.source) ? (
        <Tooltip
          title={sortLabel}
          placement={
            field.props.textAlign === 'right' || field.type.textAlign === 'right'
              ? 'bottom-end'
              : 'bottom-start'
          }
          enterDelay={300}
        >
          <TableSortLabel
            active={sort.field === (field.props.sortBy || field.props.source)}
            direction={sort.order === 'ASC' ? 'asc' : 'desc'}
            data-field={field.props.sortBy || field.props.source}
            data-order={field.props.sortByOrder || 'ASC'}
            onClick={updateSort}
            classes={DatagridHeaderCellClasses}
          >
            <span className="DatagridHeaderCell-title">
              <FieldTitle
                label={field.props.label}
                source={field.props.source}
                resource={resource}
              />
            </span>
          </TableSortLabel>
        </Tooltip>
      ) : (
        <FieldTitle label={field?.props.label} source={field?.props.source} resource={resource} />
      )}
      {actionEl && (
        <Box
          className="DatagridHeaderCell-action"
          sx={{
            height: 'calc(100% - 16px)',
            alignSelf: 'stretch',
            position: 'absolute',
            right: 0,
            top: 8,
            ml: 0.5,
          }}
        >
          {actionEl}
        </Box>
      )}
    </StyledTableCell>
  );
};

// Habarico customization
// RA's DatagridField has props typed as {}, making field.props.source etc. inaccessible in
// TypeScript-checked consumers. We redeclare DatagridField here with explicit props so that
// components like ResizableHeaderCellAction can access them without unsafe casts.
export type DatagridFieldProps = {
  source?: string;
  label?: string | React.ReactElement | false;
  textAlign?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sortBy?: string;
  sortByOrder?: 'ASC' | 'DESC';
  headerClassName?: string;
  fixed?: boolean;
};

export type DatagridField = React.ReactElement<DatagridFieldProps> & {
  type?: {
    sortable?: boolean;
    textAlign?: TableCellProps['align'];
  };
};

export interface DatagridHeaderActionElementProps {
  field?: DatagridField;
}

export interface DatagridHeaderCellProps extends Omit<TableCellProps, 'classes' | 'resource'> {
  className?: string;
  field?: DatagridField;
  isSorting?: boolean;
  sort?: SortPayload;
  updateSort?: (event: React.MouseEvent<HTMLElement>) => void;
  action?: ReactElement<DatagridHeaderActionElementProps>;
}

export default memo(
  DatagridHeaderCell,
  (props, nextProps) =>
    props.updateSort === nextProps.updateSort &&
    props.sort?.field === nextProps.sort?.field &&
    props.sort?.order === nextProps.sort?.order &&
    props.isSorting === nextProps.isSorting
);

const PREFIX = 'RaDatagridHeaderCell';

export const DatagridHeaderCellClasses = {
  icon: `${PREFIX}-icon`,
};

// Remove the sort icons when not active
const StyledTableCell = styled(TableCell, {
  name: PREFIX,
  overridesResolver: (props, styles) => styles.root,
})({
  [`& .MuiTableSortLabel-icon`]: {
    display: 'none',
  },
  [`& .Mui-active .MuiTableSortLabel-icon`]: {
    display: 'inline',
  },
});

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    RaDatagridHeaderCell: 'root' | 'icon';
  }

  interface ComponentsPropsList {
    RaDatagridHeaderCell: Partial<DatagridHeaderCellProps>;
  }

  interface Components {
    RaDatagridHeaderCell?: {
      defaultProps?: ComponentsPropsList['RaDatagridHeaderCell'];
      styleOverrides?: ComponentsOverrides<Omit<Theme, 'components'>>['RaDatagridHeaderCell'];
    };
  }
}
