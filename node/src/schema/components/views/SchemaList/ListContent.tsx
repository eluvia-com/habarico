import React, {ReactNode} from 'react';
import {Pagination, useLocaleState} from 'react-admin';
import {ListShell} from '@admin/components/views/ListShell';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {useSidePanelController} from '@admin/contexts/SidePanelContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {FilterDiv} from '@admin/overrides/ra-iu-materialui';
import {ViewSchemaBreadcrumbs} from '@schema/components/breadcrumbs/ViewSchemaBreadcrumbs';
import {SchemaDatagrid} from '@schema/components/collections/SchemaDatagrid';
import {SchemaListActions} from '@schema/components/views/SchemaListActions';
import {SchemaSidePanel} from '@schema/components/views/SchemaSidePanel';
import {SchemaViewTitle} from '@schema/components/views/SchemaViewTitle';
import {SchemaViewToolbarActions} from '@schema/components/views/SchemaViewToolbarActions';
import {useLocalResourceSchemaContext} from '@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext';
import {MethodSchemaProvider} from '@schema/contexts/MethodSchemaContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {useGetTargetValues} from '@schema/hooks/useGetTargetValues';
import {SidePanelView} from '@schema/types';
import {convertApiSortToRaSort, generateFilterSchemas} from '@schema/utils/api';
import {
  FIELDSET_DEFAULT,
  FIELD_DEFAULT,
  FieldSelection,
  actionDescriptorsToFieldSelection,
  descriptorsNeedAllActions,
  fieldDescriptorsToActionSelection,
  fieldDescriptorsToFieldSelection,
  mergeFieldSelections,
} from '@schema/utils/fieldSelection';
import {buildDrawerFilter, buildInlineFilter} from '@schema/utils/filterElements';
import {DataType} from '@typing';

// Renders the docked preview panel when the list's side panel controller has an open view.
// Kept as its own component so it can consume the controller provided above it.
const ListSidePanelSlot = () => {
  const controller = useSidePanelController<SidePanelView>();
  if (!controller?.active) return null;
  return <SchemaSidePanel view={controller.active} onClose={controller.close} />;
};

type ListContentProps = {
  datagridButtons?: ReactNode;
  title?: ReactNode;
  toolbarActions?: ReactNode;
  listActions?: ReactNode;
};

export const ListContent = ({
  datagridButtons,
  title = <SchemaViewTitle />,
  toolbarActions = <SchemaViewToolbarActions />,
  listActions = <SchemaListActions />,
}: ListContentProps) => {
  const {defaultPerPage} = useAdminConfig();
  // Thread the active locale into the list query's `meta`: it lands in the RA query key (a language
  // switch refetches the list) and reaches `dataProvider.getList` as `params.meta.locale`, so the
  // backend can localize each row's `meta.schema.actions` (the row-action button labels) — HAB-782.
  const [locale] = useLocaleState();
  const {actions, resource} = useLocalResourceSchemaContext();
  const {viewSchema, methodSchema} = useViewSchemaContext();
  if (!viewSchema.list || !actions) throw new Error('List view schema has invalid format');
  const viewSchemaProperties = viewSchema.list;
  const listFields = viewSchemaProperties.boxes;

  const {presentation} = useViewPresentation();
  const isInOverlay = presentation !== 'page';

  // --------------------------------------------------------------------------
  // Filters
  // --------------------------------------------------------------------------

  const targetValues = useGetTargetValues();

  const filter = {
    ...viewSchema.list.extraFilters,
    ...targetValues,
  };

  const filterSchemas = generateFilterSchemas(
    methodSchema.filters || [],
    viewSchemaProperties.filters
  );

  const filterDefaultValues = filterSchemas
    .filter((f) => f.defaultValue !== undefined && f.isAlwaysOn)
    .reduce((acc, f) => {
      acc[f.name] = f.defaultValue;
      return acc;
    }, {} as DataType);

  const toolbarFilters = filterSchemas.filter((f) => f.isAlwaysOn).map(buildInlineFilter);

  const otherFilters = filterSchemas.filter((f) => !f.isAlwaysOn);
  const drawerFilters = otherFilters.map(buildDrawerFilter);
  const dialogFilters = otherFilters.map(buildInlineFilter);

  // --------------------------------------------------------------------------
  // Datagrid
  // --------------------------------------------------------------------------

  const fieldSelection = listFields
    ? fieldDescriptorsToFieldSelection(listFields)
    : FIELDSET_DEFAULT;

  const rowActions = viewSchemaProperties.rowActions;
  const actionFields = listFields ? fieldDescriptorsToActionSelection(listFields) : {};
  const actionSelection: FieldSelection | string =
    rowActions === undefined || descriptorsNeedAllActions(rowActions)
      ? FIELD_DEFAULT
      : mergeFieldSelections(actionFields, actionDescriptorsToFieldSelection(rowActions));

  const isSortable = !!viewSchemaProperties.sortable;
  const pagination = !isSortable ? <Pagination /> : false;
  const sort: {field: string; order: 'ASC' | 'DESC'} = isSortable
    ? convertApiSortToRaSort({
        fieldName: viewSchemaProperties.sortable?.fieldName || 'id',
        direction: 'asc',
      })
    : convertApiSortToRaSort(viewSchemaProperties.defaultSorting);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const preferenceKey = `${resource}.list.datagrid`;

  // Inline filter form (always-on filters; in a dialog the drawer filters fold in as inline too).
  const filtersNode =
    toolbarFilters.length > 0 || isInOverlay ? (
      <FilterDiv filters={isInOverlay ? [...toolbarFilters, ...dialogFilters] : toolbarFilters} />
    ) : undefined;

  // The admin `ListShell` mounts the `SidePanelProvider` (it owns the RA controller, the
  // `ListConfigProvider`, the `ViewContent` frame and the `ListSurface` card that docks the panel),
  // so the list (row activation) and the docked panel slot share one controller. The schema layer
  // only supplies the computed controller props, the config, the slot nodes and the datagrid
  // (inside its `MethodSchemaProvider`).
  return (
    <ListShell
      infinite={isSortable}
      title={title}
      toolbarActions={toolbarActions}
      breadcrumbs={<ViewSchemaBreadcrumbs />}
      listActions={listActions}
      filters={filtersNode}
      sidePanel={<ListSidePanelSlot />}
      listConfig={{
        preferenceKey,
        sort,
        filterDefaultValues,
        filters: drawerFilters,
        hasInlineFilters: toolbarFilters.length > 0,
      }}
      controllerProps={{
        empty: false,
        queryOptions: {
          meta: {
            locale,
            fields: {
              ...fieldSelection,
              meta: {
                repr: FIELD_DEFAULT,
                tags: FIELD_DEFAULT,
                schema: {
                  actions: actionSelection,
                  name: FIELD_DEFAULT,
                  label: FIELD_DEFAULT,
                  pk_field_name: FIELD_DEFAULT,
                },
              },
            },
          },
        },
        filterDefaultValues,
        pagination,
        sort,
        perPage: defaultPerPage,
        filter,
      }}
    >
      <MethodSchemaProvider schema={methodSchema}>
        <SchemaDatagrid
          fields={listFields}
          rowActions={rowActions}
          rowActionButtons={datagridButtons}
          indexField={viewSchemaProperties.sortable?.fieldName}
          sortForFilters={viewSchemaProperties.sortable?.sortForFilters}
          singleClickAction={viewSchemaProperties.singleClickAction}
          doubleClickAction={viewSchemaProperties.doubleClickAction}
        />
      </MethodSchemaProvider>
    </ListShell>
  );
};
