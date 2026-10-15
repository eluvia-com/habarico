// @ts-nocheck
/* eslint-disable */
import clsx from 'clsx';
import {get} from 'lodash-es';
import * as React from 'react';
import {type HtmlHTMLAttributes, type ReactNode, useCallback, useEffect} from 'react';
import {FilterFormInput, useFilterContext, useListContext, useResourceContext} from 'react-admin';
import {type ComponentsOverrides, styled, useThemeProps} from '@mui/material/styles';
import {FilterLiveDiv} from './FilterLiveDiv';

export const FilterDiv = (inProps: FilterFormProps) => {
  const props = useThemeProps({
    props: inProps,
    name: PREFIX,
  });
  const {filters: filtersProps, ...rest} = props;
  const filters = useFilterContext() || filtersProps;

  return (
    <FilterLiveDiv formComponent={StyledForm} {...sanitizeRestProps(rest)}>
      <FilterFormBase filters={filters} />
    </FilterLiveDiv>
  );
};

export type FilterFormProps = FilterFormBaseProps;

export const FilterFormBase = (props: FilterFormBaseProps) => {
  const {filters} = props;
  const resource = useResourceContext(props);
  const {displayedFilters = {}, filterValues, hideFilter} = useListContext();

  useEffect(() => {
    if (!filters) return;
    filters.forEach((filter: React.ReactNode) => {
      if (React.isValidElement(filter) && filter.props.alwaysOn && filter.props.defaultValue) {
        throw new Error(
          'Cannot use alwaysOn and defaultValue on a filter input. Please set the filterDefaultValues props on the <List> element instead.'
        );
      }
    });
  }, [filters]);

  const getShownFilters = () => {
    if (!filters) return [];
    const values = filterValues;
    return filters.filter((filterElement): filterElement is React.ReactElement => {
      if (!React.isValidElement(filterElement)) return false;
      const filterValue = get(values, filterElement.props.source);
      return (
        filterElement.props.alwaysOn ||
        displayedFilters[filterElement.props.source] ||
        !isEmptyValue(filterValue)
      );
    });
  };

  const handleHide = useCallback(
    (event: React.MouseEvent<HTMLElement>) => hideFilter(event.currentTarget.dataset.key),
    [hideFilter]
  );

  return (
    <>
      {getShownFilters().map((filterElement) => (
        <FilterFormInput
          key={filterElement.key || filterElement.props.source}
          filterElement={filterElement}
          handleHide={handleHide}
          resource={resource}
          className={FilterFormClasses.filterFormInput}
        />
      ))}
      <div className={FilterFormClasses.clearFix} />
    </>
  );
};

const sanitizeRestProps = ({
  hasCreate,
  resource,
  ...props
}: Partial<FilterFormBaseProps> & {hasCreate?: boolean}) => props;

export type FilterFormBaseProps = Omit<HtmlHTMLAttributes<HTMLFormElement>, 'children'> & {
  className?: string;
  resource?: string;
  filters?: ReactNode[];
};

const PREFIX = 'RaFilterForm';

export const FilterFormClasses = {
  clearFix: `${PREFIX}-clearFix`,
  filterFormInput: `${PREFIX}-filterFormInput`,
};

// Habarico customization: change the form to div element. Because inline list cannot be nested in another form
// The custom render function inside StyledForm now destructures out the incoming className and merges it with
// clsx() instead of overwriting it. This restores the emotion-generated class (carrying flexWrap: wrap,
// the down('sm') → width: 100% mobile-stacking rule, minHeight, padding, etc.) that was being silently discarded before
// — while still keeping the literal "filter-form" class other stylesheets (like listSx.ts) depend on.
const StyledForm = styled(
  ({className, ...props}) => <div {...props} className={clsx(className, 'filter-form')} />,
  {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
  }
)(({theme}) => ({
  display: 'flex',
  flex: '0 1 auto',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
  [theme.breakpoints.up('sm')]: {
    minHeight: theme.spacing(8),
  },
  [theme.breakpoints.up('md')]: {
    flex: '0 1 100%',
  },
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  pointerEvents: 'none',
  padding: `0 0 ${theme.spacing(0.5)} 0`,
  '& .MuiFormHelperText-root': {display: 'none'},
  [`& .${FilterFormClasses.clearFix}`]: {clear: 'right'},
  [`& .${FilterFormClasses.filterFormInput} .MuiFormControl-root`]: {
    marginTop: `${theme.spacing(1)}`,
  },
}));

const isEmptyValue = (filterValue: unknown): boolean => {
  if (filterValue === '' || filterValue == null) return true;

  // If one of the value leaf is not empty
  // the value is considered not empty
  if (typeof filterValue === 'object') {
    return Object.keys(filterValue).every((key) => isEmptyValue(filterValue[key]));
  }

  return false;
};

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    RaFilterForm: 'root';
  }

  interface ComponentsPropsList {
    RaFilterForm: Partial<FilterFormProps>;
  }

  interface Components {
    RaFilterForm?: {
      defaultProps?: ComponentsPropsList['RaFilterForm'];
      styleOverrides?: ComponentsOverrides<Omit<Theme, 'components'>>['RaFilterForm'];
    };
  }
}
