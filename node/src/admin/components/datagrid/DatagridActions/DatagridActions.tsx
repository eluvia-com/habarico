import React from 'react';
import {useTranslate} from 'react-admin';
import {FilterButton} from '@admin/components/buttons/FilterButton';
import {FilterDrawerButton} from '@admin/components/buttons/FilterDrawerButton';
import {ResetColumnsWidthDatagridButton} from '@admin/components/buttons/ResetColumnsWidthDatagridButton';
import {ResetConfigurableDatagridButton} from '@admin/components/buttons/ResetConfigurableDatagridButton';
import {ResetFiltersDatagridButton} from '@admin/components/buttons/ResetFiltersDatagridButton';
import {ResetSortDatagridButton} from '@admin/components/buttons/ResetSortDatagridButton';
import {SavedQueriesButton} from '@admin/components/buttons/SavedQueriesButton';
import {SelectColumnsButton} from '@admin/components/buttons/SelectColumnsButton';
import {useListConfigContext} from '@admin/contexts/ListConfigContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {Icon, IconType, buttonIconPx} from '@design/atoms/Icon';
import {useMenu} from '@design/hooks/useMenu';
import {IconButton, Tooltip} from '@mui/material';

export type DatagridActionsProps = {
  /**
   * Show the column-selector button. Off by default; driven by a schema/app flag the caller reads
   * (the schema list actions pass `AdminConfig.columnSelector`).
   */
  columnSelector?: boolean;
  /**
   * Icon-button size for the config actions. Defaults to `medium` (the standalone list toolbar);
   * an embedded list-box toolbar passes `small`.
   */
  size?: 'small' | 'medium';
};

// The datagrid-config actions (the fragment of buttons shown above a list). The primary actions —
// reset column widths, the filter drawer (or an in-dialog filter button) and saved queries — stay
// inline; the secondary config actions (column selector, filter / sort / config resets) collapse into a `⋮`
// menu once there is more than one of them (a single one would make the menu pointless, so it stays
// inline). This split is purely content-driven, not responsive — we always know exactly which buttons
// belong in the menu — so it needs no `OverflowToolbar`: each button just takes `surface="menuItem"`
// to render itself as a labelled menu item. It reads the list config from `ListConfigContext`, so it
// must render inside a `ListConfigProvider` (e.g. `ListShell`). Schema-free — `ListShell` mounts it as
// the default `listActions`, and the schema list actions render it alongside their own `SchemaButtons`.
export const DatagridActions = ({
  columnSelector = false,
  size = 'medium',
}: DatagridActionsProps) => {
  const {preferenceKey, sort, filterDefaultValues, filters, hasInlineFilters} =
    useListConfigContext();
  const {presentation} = useViewPresentation();
  const isInOverlay = presentation !== 'page';
  const translate = useTranslate();
  const {Menu, openMenu} = useMenu();

  // Sort + config resets are always present; the filter reset only when the list has filters — in the
  // drawer or inline in the toolbar — the column selector is optional. Collapse into the menu only
  // when there is more than one (a lone button stays a plain icon button — a menu for it is moot).
  const hasFilters = filters.length > 0;
  const canResetFilters = hasFilters || Boolean(hasInlineFilters);
  const secondaryCount = 2 + (canResetFilters ? 1 : 0) + (columnSelector ? 1 : 0);
  const collapse = secondaryCount > 1;

  // `menuItem` inside the `⋮` menu (labelled rows); a plain icon button when shown inline.
  const surface = collapse ? 'menuItem' : 'iconButton';
  const secondaryActions = [
    columnSelector && (
      <SelectColumnsButton
        key="columns"
        preferenceKey={preferenceKey}
        surface={surface}
        size={size}
        color="inherit"
      />
    ),
    canResetFilters && (
      <ResetFiltersDatagridButton
        key="filters"
        filterDefaultValues={filterDefaultValues}
        surface={surface}
        size={size}
        color="inherit"
      />
    ),
    <ResetSortDatagridButton
      key="sort"
      sort={sort}
      surface={surface}
      size={size}
      color="inherit"
    />,
    <ResetConfigurableDatagridButton
      key="config"
      preferenceKey={preferenceKey}
      sort={sort}
      filterDefaultValues={filterDefaultValues}
      surface={surface}
      size={size}
      color="inherit"
    />,
  ].filter(Boolean);

  const moreLabel = translate('ra.action.more_actions', {_: 'More actions'});

  return (
    <>
      {hasFilters && (
        <>
          {isInOverlay ? (
            <FilterButton filters={filters} size={size} color="inherit" />
          ) : (
            <FilterDrawerButton
              filters={filters}
              showLabel={false}
              size={size}
              color="inherit"
              // A reset-filters action at the bottom of the filter panel (in addition to the one in
              // the `⋮` menu) — resets just the filters to their defaults, leaving sort and columns.
              footer={
                <ResetFiltersDatagridButton
                  filterDefaultValues={filterDefaultValues}
                  surface="button"
                  size="small"
                  color="inherit"
                />
              }
            />
          )}
          <SavedQueriesButton size={size} />
        </>
      )}

      <ResetColumnsWidthDatagridButton
        preferenceKey={preferenceKey}
        showLabel={false}
        size={size}
        color="inherit"
      />
      {collapse ? (
        <>
          <Tooltip title={moreLabel}>
            <IconButton size={size} color="inherit" aria-label={moreLabel} onClick={openMenu}>
              <Icon icon={IconType.MoreVert} size={buttonIconPx(size)} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            transformOrigin={{vertical: 'top', horizontal: 'right'}}
          >
            {secondaryActions}
          </Menu>
        </>
      ) : (
        secondaryActions
      )}
    </>
  );
};
