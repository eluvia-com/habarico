import {isEqual} from 'lodash-es';
import queryString from 'query-string';
import React, {useCallback, useState} from 'react';
import {
  SavedQuery,
  extractValidSavedQueries,
  useListContext,
  useNavigate,
  useResourceContext,
  useSavedQueries,
  useTranslate,
} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';
import {
  Box,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';

export type SavedQueriesButtonProps = ActionButtonProps;

/**
 * A button that manages saved filter queries for the current list.
 * Opens a menu with saved queries that can be applied, removed individually (via ✕),
 * or cleared entirely. Also allows saving the current filter state under a custom name
 * via an inline text input — no dialog required. Builds on {@link ActionButton} — all its props
 * pass through to the trigger (`surface` defaults to `iconButton`, `size` to `medium`).
 */
export const SavedQueriesButton = ({
  surface = 'iconButton',
  size = 'medium',
  color = 'inherit',
  label,
  ...rest
}: SavedQueriesButtonProps) => {
  const translate = useTranslate();
  const resource = useResourceContext();
  const [savedQueries, setSavedQueries] = useSavedQueries(resource || '');
  const navigate = useNavigate();
  const {displayedFilters = {}, filterValues, perPage, setFilters, sort} = useListContext();

  const hasFilterValues = !isEqual(filterValues, {});
  const validSavedQueries = extractValidSavedQueries(savedQueries);
  const hasSavedCurrentQuery = validSavedQueries.some((savedQuery) =>
    isEqual(savedQuery.value, {filter: filterValues, sort, perPage, displayedFilters})
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [savingName, setSavingName] = useState(false);
  const [queryName, setQueryName] = useState('');

  const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
    setSavingName(false);
    setQueryName('');
  }, []);

  const handleSaveQuery = useCallback(() => {
    if (!queryName.trim()) return;
    setSavedQueries([
      ...validSavedQueries,
      {label: queryName.trim(), value: {filter: filterValues, sort, perPage, displayedFilters}},
    ] as SavedQuery[]);
    setSavingName(false);
    setQueryName('');
  }, [
    queryName,
    validSavedQueries,
    setSavedQueries,
    filterValues,
    sort,
    perPage,
    displayedFilters,
  ]);

  const disabled = validSavedQueries.length === 0 && !hasFilterValues;

  return (
    <>
      <ActionButton
        {...rest}
        surface={surface}
        size={size}
        color={color}
        icon={<Icon icon={IconType.BookmarkBorder} />}
        label={label ?? translate('ra.saved_queries.label', {_: 'Saved filters'})}
        onClick={handleOpenMenu}
        disabled={disabled}
      />
      <Menu
        open={menuOpen}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        PaperProps={{sx: {minWidth: 220}}}
      >
        {validSavedQueries.map((savedQuery, index) => {
          const isActive = isEqual(savedQuery.value, {
            filter: filterValues,
            sort,
            perPage,
            displayedFilters,
          });
          return (
            <MenuItem
              key={index}
              selected={isActive}
              onClick={() => {
                navigate({
                  search: queryString.stringify({
                    filter: JSON.stringify(savedQuery.value.filter),
                    sort: savedQuery.value.sort?.field,
                    order: savedQuery.value.sort?.order,
                    page: 1,
                    perPage: savedQuery.value.perPage,
                    displayedFilters: JSON.stringify(savedQuery.value.displayedFilters),
                  }),
                });
                handleCloseMenu();
              }}
            >
              <ListItemIcon>
                <Icon icon={IconType.BookmarkBorder} fontSize="small" />
              </ListItemIcon>
              <ListItemText>{savedQuery.label}</ListItemText>
              <IconButton
                size="small"
                edge="end"
                sx={{ml: 1}}
                onClick={(e) => {
                  e.stopPropagation();
                  setSavedQueries(validSavedQueries.filter((_, i) => i !== index) as SavedQuery[]);
                }}
              >
                <Icon icon={IconType.Close} fontSize="small" />
              </IconButton>
            </MenuItem>
          );
        })}
        {validSavedQueries.length > 0 && <Divider />}
        {hasFilterValues && !hasSavedCurrentQuery && !savingName && (
          <MenuItem
            onClick={() => {
              setSavingName(true);
              setQueryName('');
            }}
          >
            <ListItemIcon>
              <Icon icon={IconType.BookmarkAdd} fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {translate('ra.saved_queries.new_label', {_: 'Save current filter...'})}
            </ListItemText>
          </MenuItem>
        )}
        {hasFilterValues && !hasSavedCurrentQuery && savingName && (
          <Box sx={{px: 1, py: 0.5, width: 0, minWidth: '100%', boxSizing: 'border-box'}}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleSaveQuery();
                if (e.key === 'Escape') setSavingName(false);
              }}
              placeholder={translate('ra.saved_queries.query_name', {_: 'Filter name'})}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" disabled={!queryName.trim()} onClick={handleSaveQuery}>
                      <Icon icon={IconType.BookmarkAdd} fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
        {validSavedQueries.length > 0 && (
          <MenuItem
            onClick={() => {
              setSavedQueries([]);
              handleCloseMenu();
            }}
          >
            <ListItemIcon>
              <Icon icon={IconType.BookmarkRemove} fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {translate('ra.action.remove_saved_queries', {_: 'Remove all saved filters'})}
            </ListItemText>
          </MenuItem>
        )}
        {(hasFilterValues || hasSavedCurrentQuery) && (
          <MenuItem
            onClick={() => {
              setFilters({}, {});
              handleCloseMenu();
            }}
          >
            <ListItemIcon>
              <Icon icon={IconType.Clear} fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {translate('ra.action.remove_all_filters', {_: 'Cancel filtering'})}
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
