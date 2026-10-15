import React from 'react';
import {Datagrid as RaDatagrid, DatagridProps as RaDatagridProps} from 'react-admin';
import {DatagridConfigurable} from '@admin/overrides/ra-iu-materialui';
import {Icon, IconType} from '@design/atoms/Icon';
import {SvgIconProps, SxProps, Theme} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import {datagridSx} from './datagridSx';

// The column-sort caret — the design-system rounded drop caret at the same size as
// `design/organisms/DataGrid`. MUI's `TableSortLabel` rotates a single icon for the ascending /
// descending directions, so one down-caret covers both.
const SortIcon = (props: SvgIconProps) => (
  <Icon icon={IconType.ArrowDropDown} size={32} {...props} />
);

// Scopes the sort caret to this datagrid by adding it as `TableSortLabel`'s default icon, so the
// vendored React Admin header override (`DatagridHeaderCell`) stays untouched. Merged onto the
// ambient theme (module-level → stable reference, so MUI memoizes the derived theme). The overlay
// positioning that keeps the caret from growing the header cell lives in `datagridSx`.
const withSortIcon = (outerTheme: Theme): Theme => ({
  ...outerTheme,
  components: {
    ...outerTheme.components,
    MuiTableSortLabel: {
      ...outerTheme.components?.MuiTableSortLabel,
      defaultProps: {
        ...outerTheme.components?.MuiTableSortLabel?.defaultProps,
        IconComponent: SortIcon,
      },
    },
  },
});

export type StyledDatagridProps = RaDatagridProps & {
  /** Render the column-configurable variant (adds the columns-management panel + persistence). */
  configurable?: boolean;
  /** Store key for the configurable variant's column preferences. */
  preferenceKey?: string;
};

/**
 * React Admin's `<Datagrid>` restyled into the redesign — the neutral header band, the design-system
 * sort caret, the hover/selected row tint + accent stripe, per-row semantic tinting and the sticky
 * actions column, all via `datagridSx`. This is the presentational core shared by `AdminDatagrid`
 * (which layers on resource preferences, row-click navigation, drag-and-drop and resizable columns)
 * and by the schema array box (which supplies its own `body`). Pure pass-through — every RA
 * `Datagrid` prop works, including a custom `body`/`header`; it only adds the skin, the sort caret
 * and a `configurable` toggle.
 */
export const StyledDatagrid = ({
  configurable = false,
  preferenceKey,
  sx,
  children,
  ...rest
}: StyledDatagridProps) => {
  // The skin goes first so a consumer `sx` can still override it.
  const mergedSx: SxProps<Theme> = [datagridSx, ...(Array.isArray(sx) ? sx : [sx])];

  const grid = configurable ? (
    <DatagridConfigurable {...rest} preferenceKey={preferenceKey} sx={mergedSx}>
      {children}
    </DatagridConfigurable>
  ) : (
    <RaDatagrid {...rest} sx={mergedSx}>
      {children}
    </RaDatagrid>
  );

  // Scope the sort caret to this datagrid without touching the vendored RA header override.
  return <ThemeProvider theme={withSortIcon}>{grid}</ThemeProvider>;
};
