import React, {ReactNode} from 'react';
import {
  InfiniteList,
  InfinitePagination,
  List,
  ListProps,
  ResourceContextProvider,
  TopToolbar,
} from 'react-admin';
import {DatagridActions} from '@admin/components/datagrid/DatagridActions';
import {ListSurface} from '@admin/components/views/ListSurface';
import {ViewContent} from '@admin/components/views/ViewContent';
import {ListConfig, ListConfigProvider} from '@admin/contexts/ListConfigContext';
import {SidePanelProvider} from '@admin/contexts/SidePanelContext';
import {ResponsiveScrollbar} from '@design/atoms/Scrollbar';
import {listSx} from './listSx';

export type ListShellProps = {
  /** Wrap in a `ResourceContextProvider` for schema-free use; omit when an ambient resource exists. */
  resource?: string;
  /**
   * Use `<InfiniteList>` (infinite scroll) instead of the paginated `<List>`; the shell then appends
   * an `<InfinitePagination>` after the datagrid.
   */
  infinite?: boolean;
  /**
   * Plain React Admin `<List>` / `<InfiniteList>` controller props (`queryOptions`, `exporter`,
   * `sort`, `perPage`, `filter`, `filterDefaultValues`, `pagination`, `empty`, …). Schema-agnostic
   * RA values, so the schema ring configures the controller without leaking a schema type here.
   */
  controllerProps?: Omit<ListProps, 'children'>;
  /** Feeds the `ListConfigProvider` the datagrid-config buttons read (preferenceKey / sort / filters). */
  listConfig: ListConfig;
  /** Page-header title (portaled by `ViewContent` → `ViewTitle`). */
  title?: ReactNode;
  /** Page-header actions (portaled by `ViewContent` → `ViewActions`). */
  toolbarActions?: ReactNode;
  breadcrumbs?: ReactNode;
  /**
   * Datagrid toolbar buttons (filter drawer, column / sort / config resets) — the `<List>` actions
   * bar. Defaults to the admin `DatagridActions` (a working toolbar for a schema-free list); pass
   * `null` to hide it, or your own node (the schema list passes `SchemaListActions`).
   */
  listActions?: ReactNode;
  /** Composed inline filter node — the `<List>` filters slot. */
  filters?: React.ReactElement;
  /** Optional docked detail panel; when present the body is a two-column layout. */
  sidePanel?: ReactNode;
  /** The datagrid (the schema ring passes it already wrapped in its `MethodSchemaProvider`). */
  children: ReactNode;
};

// (C) admin-context shell for the list view: owns the React Admin `<List>` / `<InfiniteList>`
// controller and the `ListConfigProvider`, and lays the datagrid out in the card-less `ViewContent`
// frame on a `ListSurface` card. The list's only visible surface is that card — `ViewContent` is
// card-less. Page-vs-dialog is read from `ViewPresentationContext` (no branching by callers).
export const ListShell = ({
  resource,
  infinite = false,
  controllerProps,
  listConfig,
  title,
  toolbarActions,
  breadcrumbs,
  listActions = <DatagridActions />,
  filters,
  sidePanel,
  children,
}: ListShellProps) => {
  // `List` and `InfiniteList` accept the same runtime controller props but diverge in their
  // generic `queryOptions` typing, so the union can't be spread onto directly. This shell only
  // forwards plain RA values, so cast to a common passthrough component type.
  const ListComponent = (infinite ? InfiniteList : List) as unknown as React.ComponentType<
    Omit<ListProps, 'children'> & {children?: ReactNode}
  >;

  const listEl = (
    <ListComponent
      {...controllerProps}
      component="div"
      sx={listSx}
      actions={
        listActions ? (
          <TopToolbar sx={{justifyContent: 'flex-start'}}>{listActions}</TopToolbar>
        ) : (
          false
        )
      }
      filters={filters}
    >
      <ResponsiveScrollbar>
        {children}
        {infinite && <InfinitePagination />}
      </ResponsiveScrollbar>
    </ListComponent>
  );

  // `ListSurface` owns the two-column layout that docks the panel beside the list. The
  // `SidePanelProvider` is mounted only when a `sidePanel` is passed, so it wraps both the list
  // (row activation) and the slot — a single shared controller. Without a panel the provider stays
  // absent, keeping `useSidePanelController()` undefined so a schema-free list's action triggers
  // fall back to a dialog.
  const surface = <ListSurface sidePanel={sidePanel}>{listEl}</ListSurface>;
  const body = (
    <ListConfigProvider hasInlineFilters={Boolean(filters)} {...listConfig}>
      <ViewContent title={title} toolbarActions={toolbarActions} breadcrumbs={breadcrumbs}>
        {sidePanel ? <SidePanelProvider>{surface}</SidePanelProvider> : surface}
      </ViewContent>
    </ListConfigProvider>
  );

  if (resource) return <ResourceContextProvider value={resource}>{body}</ResourceContextProvider>;
  return body;
};
