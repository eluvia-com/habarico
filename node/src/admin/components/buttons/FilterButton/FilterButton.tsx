import * as React from 'react';
import {type ReactNode, useCallback, useState} from 'react';
import {
  FilterButtonMenuItem,
  useFilterContext,
  useListContext,
  useResourceContext,
} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';
import {Menu, styled, useThemeProps} from '@mui/material';

export type FilterButtonProps = ActionButtonProps & {
  /** The list's filter inputs; the button renders only when at least one is togglable (not `alwaysOn`). */
  filters?: ReactNode[];
  resource?: string;
};

const PREFIX = 'RaFilterButton';

/**
 * A button that opens a menu of toggleable filter inputs. Only renders when there are non-`alwaysOn`
 * filters available. Builds on {@link ActionButton} — all its props pass straight through to the
 * trigger (`surface` defaults to `iconButton`, `size` to `medium`).
 */
export const FilterButton = (inProps: FilterButtonProps) => {
  const props = useThemeProps({props: inProps, name: PREFIX});
  const {
    filters: filtersProp,
    className,
    surface = 'iconButton',
    size = 'medium',
    label = 'ra.action.add_filter',
    ...rest
  } = props;
  const filters = useFilterContext() || filtersProp;
  const resource = useResourceContext(props);
  const {displayedFilters = {}, showFilter, hideFilter} = useListContext();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (filters === undefined) {
    throw new Error('The <FilterButton> component requires the <List filters> prop to be set');
  }

  const allTogglableFilters = filters.filter(
    (filterElement): filterElement is React.ReactElement<{source: string; alwaysOn?: boolean}> =>
      React.isValidElement(filterElement)
  );

  const handleClickButton = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setOpen(true);
    setAnchorEl(event.currentTarget);
  }, []);

  const handleRequestClose = useCallback(() => setOpen(false), []);

  const handleShow = useCallback(
    ({source, defaultValue}: {source: string; defaultValue?: unknown}) => {
      showFilter(source, defaultValue === '' ? undefined : defaultValue);
      setTimeout(() => {
        const inputElement = document.querySelector(`input[name='${source}']`) as HTMLInputElement;
        if (inputElement) inputElement.focus();
      }, 50);
      setOpen(false);
    },
    [showFilter]
  );

  const handleRemove = useCallback(
    ({source}: {source: string}) => {
      hideFilter(source);
      setOpen(false);
    },
    [hideFilter]
  );

  if (allTogglableFilters.length === 0) return null;

  return (
    <Root className={className}>
      <ActionButton
        {...rest}
        className="add-filter"
        surface={surface}
        size={size}
        label={label}
        icon={<Icon icon={IconType.FilterList} />}
        onClick={handleClickButton}
      />
      <Menu open={open} anchorEl={anchorEl} onClose={handleRequestClose}>
        {allTogglableFilters.map((filterElement, index) => (
          <FilterButtonMenuItem
            key={filterElement.props.source}
            filter={filterElement}
            displayed={!!displayedFilters[filterElement.props.source]}
            resource={resource}
            onShow={handleShow}
            onHide={handleRemove}
            autoFocus={index === 0}
          />
        ))}
      </Menu>
    </Root>
  );
};

const Root = styled('div', {
  name: PREFIX,
  overridesResolver: (_props, styles) => styles.root,
})({
  display: 'inline-block',
  '& button.add-filter': {width: 'auto'},
});
