import React, {ReactNode, useState} from 'react';
import {FilterForm, InputProps, useListContext, useTranslate} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';
import {InspectorPanel} from '@design/organisms/InspectorPanel';
import {Badge, Box, SxProps, Theme} from '@mui/material';

// Lay React Admin's `FilterForm` out for the InspectorPanel: filters stacked vertically, each
// stretched to the full panel width (RA's inline row layout, per-filter spacer and hide button are
// all suppressed). `px` supplies the panel's horizontal gutter (the panel body has none of its own).
const filterFormSx: SxProps<Theme> = {
  px: 2,
  form: {display: 'block', margin: 0},
  '& .RaFilterForm-filterFormInput': {
    display: 'block',
    width: '100%',
    marginTop: 0,
    marginBottom: '1rem',
  },
  '& .RaFilterForm-filterFormInput:last-of-type': {marginBottom: 0},
  '& .RaFilterFormInput-spacer': {display: 'none'},
  '& .RaFilterFormInput-hideButton': {display: 'none'},
  '& .MuiFormControl-root': {width: '100%', marginTop: 0},
};

export type FilterDrawerButtonProps = Omit<ActionButtonProps, 'onClick'> & {
  filters: React.ReactElement<InputProps>[];
  /**
   * Optional footer content for the panel — e.g. a reset-filters action. Injected by the
   * caller (rather than read from context) so this button stays usable outside a list-config scope.
   */
  footer?: ReactNode;
};

/**
 * A filter toggle button that opens the list's filters in the design-layer `InspectorPanel` (a
 * right-anchored panel over a dimmed backdrop), managing its own open state. Renders a badge with the
 * count of active filters; inside the panel the provided filters are stacked full-width, with an
 * optional `footer` action (e.g. reset filters).
 */
export const FilterDrawerButton = ({
  color,
  filters,
  footer,
  surface = 'iconButton',
  size = 'medium',
  label,
  ...rest
}: FilterDrawerButtonProps) => {
  const [open, setOpen] = useState(false);
  const translate = useTranslate();
  const {filterValues} = useListContext();

  const filterSources = new Set(filters.map((f) => f.props?.source as string).filter(Boolean));
  const activeCount = Object.keys(filterValues).filter((k) => filterSources.has(k)).length;
  const contrastColor = color === 'primary' ? 'secondary' : 'primary';

  if (filters.length === 0) return null;

  return (
    <>
      <Badge badgeContent={activeCount} color={contrastColor} invisible={activeCount === 0} max={9}>
        <ActionButton
          {...rest}
          surface={surface}
          size={size}
          color={open ? contrastColor : color}
          onClick={() => setOpen((prev) => !prev)}
          label={
            label ??
            (open ? translate('ra.action.close_filters') : translate('ra.action.open_filters'))
          }
          icon={<Icon icon={IconType.FilterList} />}
        />
      </Badge>
      <InspectorPanel
        open={open}
        onClose={() => setOpen(false)}
        icon={IconType.FilterList}
        title={translate('ra.filter.title', {_: 'Advanced filters'})}
        subtitle={translate('ra.filter.subtitle', {
          _: 'Choose additional conditions to narrow down the selection',
        })}
        footer={footer}
      >
        <Box sx={filterFormSx}>
          <FilterForm filters={filters} />
        </Box>
      </InspectorPanel>
    </>
  );
};
