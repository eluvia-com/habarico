import React, {useMemo} from 'react';
import {
  InfiniteList,
  InfinitePagination,
  List,
  Pagination,
  ReferenceManyField,
  useLocaleState,
  useRecordContext,
  useTranslate,
} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {ErrorPage as ErrorComponent} from '@admin/components/common/ErrorPage';
import {Loading} from '@admin/components/common/Loading';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {ListConfigProvider} from '@admin/contexts/ListConfigContext';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {FilterDiv} from '@admin/overrides/ra-iu-materialui';
import {ResponsiveScrollbar} from '@design/atoms/Scrollbar';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {Alert} from '@mui/material';
import {buildBoxHeaderActions} from '@schema/components/boxes/BoxHeaderActions';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {SchemaDatagrid} from '@schema/components/collections/SchemaDatagrid';
import {SchemaDatagridRowActions} from '@schema/components/collections/SchemaDatagrid/SchemaDatagridRowActions';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {MethodSchemaProvider} from '@schema/contexts/MethodSchemaContext';
import {useWasBoxEverVisible} from '@schema/contexts/ParentBoxContext';
import {ParentResourceDescriptorsProvider} from '@schema/contexts/ParentResourceDescriptorsContext';
import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {useGetLocalResourceSchema} from '@schema/hooks/useGetLocalResourceSchema';
import {FieldDescriptor, HabRecord, ListBoxParameters} from '@schema/types';
import {
  convertApiSortToRaSort,
  generateFilterSchemas,
  getTopLevelFieldDescriptors,
} from '@schema/utils/api';
import {
  FIELDSET_DEFAULT,
  FIELD_DEFAULT,
  FieldSelection,
  actionDescriptorsToFieldSelection,
  fieldDescriptorsToActionSelection,
  fieldDescriptorsToFieldSelection,
  mergeFieldSelections,
} from '@schema/utils/fieldSelection';
import {buildDrawerFilter, buildInlineFilter} from '@schema/utils/filterElements';
import {SchemaListBoxActions} from './SchemaListBoxActions';
import {listSx} from './listSx';

const buildFiltersElement = (
  toolbarFilters: React.ReactElement[],
  dialogFilters: React.ReactElement[],
  isInOverlay: boolean
): React.ReactElement | undefined => {
  if (!toolbarFilters.length && !isInOverlay) return undefined;
  return (
    <FilterDiv filters={isInOverlay ? [...toolbarFilters, ...dialogFilters] : toolbarFilters} />
  );
};

const buildFilter = (
  extraFilters: Record<string, unknown> | undefined,
  target: string | undefined,
  record: HabRecord | undefined
): Record<string, unknown> => {
  const filter: Record<string, unknown> = {...extraFilters};
  if (target && record) {
    filter[target] = record.id;
  }
  return filter;
};

const buildPreferenceKey = (
  resource: string,
  reference: string,
  target: string | undefined,
  schemaName: string
): string =>
  target
    ? `SchemaListBox.${resource}.${target}.${reference}.${schemaName}`
    : `SchemaListBox.${resource}.${reference}.${schemaName}`;

const buildRowActionButtons = (
  rowActions: ListBoxParameters['rowActions'],
  target: string | undefined
) =>
  (!rowActions || rowActions.length > 0) && (
    <SchemaDatagridRowActions descriptors={rowActions} target={target} />
  );

const buildActionSelection = (
  rowActions: ListBoxParameters['rowActions'],
  flatFields: FieldDescriptor[] | undefined
): FieldSelection | string => {
  if (rowActions === undefined) return FIELD_DEFAULT;
  const flatFieldActionSelection = flatFields ? fieldDescriptorsToActionSelection(flatFields) : {};
  return mergeFieldSelections(
    flatFieldActionSelection,
    actionDescriptorsToFieldSelection(rowActions)
  );
};

const getListSortConfig = (listSchema: ListBoxParameters) => {
  const isSortable = !!listSchema.sortable;
  return {
    isSortable,
    pagination: isSortable ? false : <Pagination />,
    sort: isSortable
      ? convertApiSortToRaSort({
          fieldName: listSchema.sortable?.fieldName || 'id',
          direction: 'asc',
        })
      : convertApiSortToRaSort(listSchema.defaultSorting),
  };
};

const SchemaListBoxContent = ({schema, label = schema.label, isRoot}: SchemaBoxProps) => {
  const record = useRecordContext<HabRecord>();
  const resource = useResourceContext();
  const {presentation} = useViewPresentation();
  const isInOverlay = presentation !== 'page';
  const parentDescriptors = useParentResourceDescriptorsContext();
  const translate = useTranslate();

  const reference = useResourceContext(schema.list?.reference);
  const [locale] = useLocaleState();
  const isLast = useIsLastPanel();
  const card = useBoxCard(schema, Boolean(label), isRoot);

  if (!schema.list) {
    throw new Error('SchemaListBox requires a list schema');
  }

  const listSchema = schema.list;

  // --------------------------------------------------------------------------
  // Get schema
  // --------------------------------------------------------------------------

  const schemaParams = {
    ...listSchema.schemaParams,
    ...(record && listSchema.target
      ? {_target: JSON.stringify({[listSchema.target]: record.id})}
      : {}),
    _source: JSON.stringify({[resource]: record?.id}),
  };

  const {
    schema: resourceSchema,
    isLoading,
    isError,
    error,
    getMethodSchema,
  } = useGetLocalResourceSchema({
    resource: reference,
    params: schemaParams,
  });
  const methodSchema = getMethodSchema('get');
  const actionsSchema = resourceSchema?.actions;
  const topLevelFields = getTopLevelFieldDescriptors(schema);
  const flatFields = topLevelFields.length ? topLevelFields : undefined;
  const {defaultPerPage} = useAdminConfig();

  // --------------------------------------------------------------------------
  // Datagrid
  // --------------------------------------------------------------------------
  const fieldSelection = flatFields
    ? fieldDescriptorsToFieldSelection(flatFields)
    : FIELDSET_DEFAULT;

  const rowActions = listSchema.rowActions;
  const actionSelection = buildActionSelection(rowActions, flatFields);

  const {isSortable, pagination, sort} = getListSortConfig(listSchema);

  // --------------------------------------------------------------------------
  // Filters
  // --------------------------------------------------------------------------

  const filterSchemas = generateFilterSchemas(methodSchema?.filters || [], listSchema.filters);

  const filterDefaultValues = filterSchemas
    .filter((filter) => filter.defaultValue !== undefined && filter.isAlwaysOn)
    .reduce(
      (acc, filter) => {
        acc[filter.name] = filter.defaultValue;
        return acc;
      },
      {} as {[key: string]: unknown}
    );

  // isAlwaysOn=true: always shown inline in toolbar, alwaysOn from schema (false = X button)
  const toolbarFilters = filterSchemas.filter((f) => f.isAlwaysOn).map(buildInlineFilter);

  // isAlwaysOn=false: go to drawer (non-dialog) or FilterButton (dialog)
  const otherFilters = filterSchemas.filter((f) => !f.isAlwaysOn);
  const drawerFilters = otherFilters.map(buildDrawerFilter);
  const dialogFilters = otherFilters.map(buildInlineFilter);

  const filter = buildFilter(listSchema.extraFilters, listSchema.target, record);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  // Memoized: it is `SchemaDatagrid`'s `rowActionButtons` prop below, which would otherwise get a
  // fresh element on every render.
  const rowActionButtons = useMemo(
    () => buildRowActionButtons(rowActions, listSchema.target),
    [rowActions, listSchema.target]
  );

  // Memoized: `ParentResourceDescriptorsProvider` passes `value` straight through, so a fresh array
  // here would invalidate the context for this box's row detail views. Before the early returns
  // below, because a hook cannot sit after one — `record?.id` is safe despite `record` only being
  // confirmed on the next line, since the value is consumed past that check.
  const parentResourceDescriptorsValue = useMemo(
    () => [...parentDescriptors, {resource, recordId: record?.id, target: listSchema.target}],
    [parentDescriptors, resource, record?.id, listSchema.target]
  );

  if (!record) return null;
  if (isLoading) return <Loading />;
  if (isError) return <ErrorComponent error={error} />;
  if (!methodSchema || !actionsSchema)
    return <Alert severity="error">{translate('ra.notification.loading_data_error')}</Alert>;

  const preferenceKey = buildPreferenceKey(resource, reference, listSchema.target, schema.name);

  const ListComponent = isSortable ? InfiniteList : List;

  let listElement = (
    <ListConfigProvider
      preferenceKey={preferenceKey}
      sort={sort}
      filterDefaultValues={filterDefaultValues}
      filters={drawerFilters}
      hasInlineFilters={toolbarFilters.length > 0}
    >
      <LocalResourceSchemaProvider resource={reference} params={schemaParams}>
        <MethodSchemaProvider schema={methodSchema}>
          <ListComponent
            component="div" // to remove default Paper component
            storeKey={`${resource}-${reference}`}
            disableSyncWithLocation={true}
            queryOptions={{
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
            }}
            actions={
              <SchemaListBoxActions
                descriptors={listSchema.listActions}
                target={listSchema.target}
              />
            }
            filterDefaultValues={filterDefaultValues}
            filters={buildFiltersElement(toolbarFilters, dialogFilters, isInOverlay)}
            pagination={pagination}
            sort={sort}
            filter={filter}
            empty={false}
            resource={reference}
            sx={listSx}
          >
            <ResponsiveScrollbar>
              <SchemaDatagrid
                fields={flatFields}
                target={listSchema.target}
                indexField={listSchema.sortable?.fieldName}
                sortForFilters={listSchema.sortable?.sortForFilters}
                rowActionButtons={rowActionButtons}
                singleClickAction={listSchema.singleClickAction}
                doubleClickAction={listSchema.doubleClickAction}
              />
              {isSortable && <InfinitePagination />}
            </ResponsiveScrollbar>
          </ListComponent>
        </MethodSchemaProvider>
      </LocalResourceSchemaProvider>
    </ListConfigProvider>
  );

  if (listSchema.target) {
    listElement = (
      <ReferenceManyField
        label={schema.label}
        reference={reference}
        target={listSchema.target}
        source="id"
        sort={sort}
        perPage={defaultPerPage}
        filter={listSchema.extraFilters}
        queryOptions={{meta: {locale}}}
      >
        {listElement}
      </ReferenceManyField>
    );
  }

  const content = listSchema.target ? (
    <ParentResourceDescriptorsProvider value={parentResourceDescriptorsValue}>
      {listElement}
    </ParentResourceDescriptorsProvider>
  ) : (
    listElement
  );

  const hasBottomActions = !!schema.bottomActions?.length;

  return (
    <BoxLayout
      schema={schema}
      card={card}
      label={label ? <DynamicText>{label}</DynamicText> : undefined}
      action={buildBoxHeaderActions({
        reference,
        schema: resourceSchema,
        schemaParams,
        resource,
        recordId: record.id,
        target: listSchema.target,
        listToolbarActions: listSchema.toolbarActions,
        boxToolbarActions: schema.toolbarActions,
      })}
      footerRight={
        hasBottomActions ? (
          <SchemaButtons size="medium" variant="contained" descriptors={schema.bottomActions} />
        ) : undefined
      }
      fullHeight={isLast}
    >
      {content}
    </BoxLayout>
  );
};

/**
 * A list box is the most expensive box there is: its own resource-schema request, then a list
 * request, then a datagrid. A tab box in edit mode mounts every tab, so on a resource with several
 * list boxes most of them sit in a hidden tab and pay all of that for nothing. `isHidden` is
 * already carried down by `ParentBoxContext` (a tab box sets it for every tab but the active one),
 * so keep the body — and with it the schema request — unmounted until this box is actually on
 * screen. Sticky once shown: switching away must not unmount the list and refetch it on the way
 * back.
 */
export const SchemaListBox = (props: SchemaBoxProps) => {
  const isVisible = useWasBoxEverVisible();

  if (!isVisible) return null;

  return <SchemaListBoxContent {...props} />;
};
