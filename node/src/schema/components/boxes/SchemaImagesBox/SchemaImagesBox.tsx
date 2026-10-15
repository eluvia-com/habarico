import React from 'react';
import {
  List,
  Pagination,
  ReferenceManyField,
  useLocaleState,
  useRecordContext,
  useTranslate,
} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {ErrorPage} from '@admin/components/common/ErrorPage';
import {Loading} from '@admin/components/common/Loading';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {FilterDiv} from '@admin/overrides/ra-iu-materialui';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {Alert, Box} from '@mui/material';
import {buildBoxHeaderActions} from '@schema/components/boxes/BoxHeaderActions';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {SchemaImages} from '@schema/components/collections/SchemaImages';
import {SchemaFilter} from '@schema/components/filters/SchemaFilter';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {MethodSchemaProvider} from '@schema/contexts/MethodSchemaContext';
import {useGetLocalResourceSchema} from '@schema/hooks/useGetLocalResourceSchema';
import {ActionDescriptor} from '@schema/types';
import {
  convertApiSortToRaSort,
  generateFilterSchemas,
  getTopLevelFieldDescriptors,
} from '@schema/utils/api';
import {SchemaImagesBoxActions} from './SchemaImagesBoxActions';
import {listSx} from './listSx';

// The box's bottom-actions row, rendered into the BoxLayout footer (or nothing when unset).
const renderBottomActions = (descriptors: ActionDescriptor[] | undefined) =>
  descriptors?.length ? (
    <SchemaButtons size="medium" variant="contained" descriptors={descriptors} />
  ) : undefined;

export const SchemaImagesBox = ({schema, label = schema.label, isRoot}: SchemaBoxProps) => {
  const record = useRecordContext();
  const resource = useResourceContext();
  const reference = useResourceContext(schema.list?.reference);
  const [locale] = useLocaleState();
  const isLast = useIsLastPanel();
  const translate = useTranslate();
  const card = useBoxCard(schema, Boolean(label), isRoot);

  const listSchema = schema.list!;

  // --------------------------------------------------------------------------
  // Get schema
  // --------------------------------------------------------------------------

  const schemaParams = {
    ...(listSchema.schemaParams || {}),
    ...(record && listSchema.target
      ? {target: JSON.stringify({[listSchema.target]: record.id})}
      : {}),
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
  const methodSchema = resourceSchema && getMethodSchema('get');
  const actionsSchema = resourceSchema?.actions;
  const topLevelFields = getTopLevelFieldDescriptors(schema);
  const flatFields = topLevelFields.length ? topLevelFields : undefined;
  const {defaultPerPage} = useAdminConfig();

  // Do not render if the tab is not active
  if (!record) return null;
  if (isLoading) return <Loading />;
  if (isError) return <ErrorPage error={error} />;
  if (!methodSchema || !actionsSchema || !schema.list)
    return <Alert severity="error">{translate('ra.notification.loading_data_error')}</Alert>;

  // --------------------------------------------------------------------------
  // Datagrid
  // --------------------------------------------------------------------------

  const isSortable = schema.list?.sortable;
  const sort = isSortable
    ? convertApiSortToRaSort({fieldName: listSchema.sortable?.fieldName || 'id', direction: 'asc'})
    : convertApiSortToRaSort(listSchema.defaultSorting);

  const perPage = isSortable ? 50 : defaultPerPage;
  const pagination = !isSortable ? <Pagination /> : false;

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

  const searchFilterSchema = filterSchemas.find(
    (filterSchema) =>
      filterSchema.name === 'search' ||
      filterSchema.name === 'search_query' ||
      filterSchema.name === 'ai_search' ||
      filterSchema.isAlwaysOn
  );
  const searchFilters = searchFilterSchema
    ? [
        <SchemaFilter
          schema={searchFilterSchema}
          label={searchFilterSchema.label}
          key={searchFilterSchema.name}
          source={searchFilterSchema.name}
          alwaysOn={searchFilterSchema.isAlwaysOn}
          defaultValue={searchFilterSchema.defaultValue}
        />,
      ]
    : []; // we assume there is only one search filter

  const otherFilters = filterSchemas
    .filter((filterSchema) => filterSchema.name !== searchFilterSchema?.name)
    .map((filterSchema) => (
      <SchemaFilter
        schema={filterSchema}
        label={filterSchema.label}
        key={filterSchema.name}
        source={filterSchema.name}
        alwaysOn={filterSchema.isAlwaysOn}
        defaultValue={filterSchema.defaultValue}
      />
    ));

  const filter = {
    ...listSchema.extraFilters,
    ...(listSchema.target ? {[listSchema.target]: record?.id} : null),
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  let listElement = (
    <LocalResourceSchemaProvider resource={reference} params={schemaParams}>
      <MethodSchemaProvider schema={methodSchema}>
        <List
          component="div" // to remove default Paper component
          storeKey={`${resource}-${reference}`}
          disableSyncWithLocation={true}
          queryOptions={{meta: {locale}}}
          actions={
            <SchemaImagesBoxActions
              descriptors={listSchema.listActions}
              target={listSchema.target}
              filters={otherFilters}
            />
          }
          filterDefaultValues={filterDefaultValues}
          filters={<FilterDiv filters={searchFilters} />}
          pagination={pagination}
          sort={sort}
          filter={filter}
          empty={false}
          resource={reference}
          sx={listSx}
        >
          <Box px={2} mb={2}>
            <SchemaImages
              fields={flatFields}
              target={schema.list.target}
              indexField={schema.list.sortable?.fieldName}
              sortForFilters={schema.list.sortable?.sortForFilters}
            />
          </Box>
        </List>
      </MethodSchemaProvider>
    </LocalResourceSchemaProvider>
  );
  if (listSchema.target) {
    listElement = (
      <ReferenceManyField
        label={schema.label}
        reference={reference}
        target={listSchema.target}
        source="id"
        sort={sort}
        perPage={perPage}
        filter={schema.list?.extraFilters}
        queryOptions={{meta: {locale}}}
      >
        {listElement}
      </ReferenceManyField>
    );
  }

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
      footerRight={renderBottomActions(schema.bottomActions)}
      fullHeight={isLast}
    >
      {listElement}
    </BoxLayout>
  );
};
