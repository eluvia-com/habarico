import React, {FC, ReactElement, ReactNode, useCallback, useEffect, useMemo, useState} from 'react';
import {
  RaRecord,
  RecordContextProvider,
  useDataProvider,
  useListContext,
  useNotify,
} from 'react-admin';
import {DraggableImagePanel} from '@admin/components/common/DraggableImagePanel';
import {FieldProps} from '@admin/components/fields/types';
import {Icon, IconType} from '@design/atoms/Icon';
import {ValueLocationContextProvider} from '@design/contexts/ValueLocationContext';
import {useDialog} from '@design/hooks/useDialog';
import {Box, Grid} from '@mui/material';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {SchemaFieldContent} from '@schema/components/fields/SchemaFieldContent';
import {useMethodSchemaContext} from '@schema/contexts/MethodSchemaContext/useMethodSchemaContext';
import {useGetField} from '@schema/contexts/ResourceFieldContext/useGetField';
import {FieldDescriptor, FieldSchema, Filters} from '@schema/types';
import {generateFieldSchemaMap} from '@schema/utils/generateFieldSchemaMap';

export type SchemaImagesProps = {
  fields?: FieldDescriptor[];
  indexField?: string;
  sortForFilters?: Filters;
  buttons?: ReactNode;
  onRowClick?: (record: RaRecord) => void;
  expand?: ReactElement | FC;
  target?: string;
};

type SchemaImagesFieldProps = {
  fieldSchema: FieldSchema;
  // Required, matching `getFieldEl`'s own `resource: string`: the only caller passes the list
  // context's `resource`, a `string` there. Optional would widen it to `string | undefined` and the
  // call below would not type.
  resource: string;
  getFieldEl: ReturnType<typeof useGetField>;
};

// Must stay out of `SchemaImages`'s render body: React identifies an instance by its component
// type, so a component defined inside a render gets a new identity every pass and is unmounted and
// remounted rather than re-rendered — losing focus state and re-running mount effects for every
// non-image field of every photo.
const SchemaImagesField = ({fieldSchema, resource, getFieldEl}: SchemaImagesFieldProps) => {
  const fieldProps: FieldProps = {
    source: fieldSchema.name,
    label: fieldSchema.shortLabel || fieldSchema.label,
    sortable: fieldSchema.sortable,
    sortBy: fieldSchema.sortBy,
  };
  const fieldEl = getFieldEl({
    resource,
    source: fieldSchema.name,
    type: fieldSchema.type,
    isInList: true,
    format: fieldSchema.format,
    schema: fieldSchema,
    props: fieldProps,
  });
  if (!fieldEl) return;

  return (
    <SchemaFieldContent
      schema={fieldSchema}
      key={`${fieldSchema.name}-${fieldSchema.targetSource}`}
      label={fieldProps.label}
      showLabel={false}
      source={fieldSchema.name}
      sortable={fieldProps.sortable}
      sortBy={fieldProps.sortBy}
    >
      {fieldEl}
    </SchemaFieldContent>
  );
};

export const SchemaImages = ({
  fields,
  target,
  indexField,
  sortForFilters = {},
  buttons = (
    <SchemaButtons
      target={target}
      surface={'iconButton'}
      size={'small'}
      isList={true}
      scope={'detail'}
      maxVisibleButtons={{xs: 2, sm: 3}}
    />
  ),
}: SchemaImagesProps) => {
  const getFieldEl = useGetField();
  const {resource, data, refetch, filterValues, sort, setSort} = useListContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();

  // --------------------------------------------------------------------------
  // Dialog
  // --------------------------------------------------------------------------

  const {Dialog, openDialog, data: dialogData} = useDialog<string>();
  const [dialogImageFailed, setDialogImageFailed] = useState(false);
  // A newly opened image can replace an earlier broken one — re-attempt loading it instead of
  // sticking to the previous failure. Adjusted during render (React's recommended pattern for
  // resetting state on a prop change) rather than an effect, so there's no extra render pass.
  const [trackedDialogData, setTrackedDialogData] = useState(dialogData);
  if (dialogData !== trackedDialogData) {
    setTrackedDialogData(dialogData);
    setDialogImageFailed(false);
  }

  // --------------------------------------------------------------------------
  // DnD
  // --------------------------------------------------------------------------

  // DND is enabled only if column sort is not allowed and filters are not applied
  const canUseDndWithFilters =
    indexField !== undefined &&
    JSON.stringify(sortForFilters, Object.keys(sortForFilters).sort()) ===
      JSON.stringify(filterValues, Object.keys(filterValues).sort());
  const enableDnd = canUseDndWithFilters && sort.field === indexField && sort.order === 'ASC';

  // Set the sort to the index field if the user can use DND with filters
  useEffect(() => {
    if (!enableDnd && canUseDndWithFilters) {
      setSort({field: indexField, order: 'ASC'});
    }
  }, [canUseDndWithFilters, enableDnd, setSort, indexField]);

  const [isUpdating, setUpdating] = useState<boolean>(false);

  // Save the record order when the user drops the item
  const handleDropRow = useCallback(
    async (record: RaRecord, index: number) => {
      if (!indexField) return;
      setUpdating(true);
      try {
        await dataProvider.update(resource, {
          id: record.id,
          data: {
            ...record,
            [indexField]: index,
          },
          previousData: record,
        });
        await refetch();
      } catch {
        notify('ra.notification.http_error', {type: 'error'});
      } finally {
        setUpdating(false);
      }
    },
    [dataProvider, indexField, notify, refetch, resource]
  );

  // --------------------------------------------------------------------------
  // Schemas
  // --------------------------------------------------------------------------

  const methodSchema = useMethodSchemaContext();
  // Memoized: `generateFieldSchemaMap` lodash-merges options per field — no need to redo it (and
  // hand out fresh field-schema objects) on every unrelated re-render of this gallery.
  const fieldSchemaMap = useMemo(
    () => generateFieldSchemaMap(methodSchema.fields, fields),
    [methodSchema.fields, fields]
  );
  const fieldSchemas = Object.values(fieldSchemaMap);
  const imageFieldSchema = fieldSchemas.filter(
    (fieldSchema) => fieldSchema.format === 'base64-image'
  )[0];
  const restFieldSchemas = fieldSchemas.filter(
    (fieldSchema) => fieldSchema.format !== 'base64-image'
  );

  if (!imageFieldSchema) return null;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <>
      <ValueLocationContextProvider value={{isInCollection: true}}>
        <Grid container spacing={2}>
          {data?.map((record: RaRecord, index) => {
            const file = record[imageFieldSchema.name];
            return (
              <Grid size={{xs: 6, sm: 4}} key={record.id} className="SchemaImages-item">
                <RecordContextProvider value={record}>
                  <DraggableImagePanel
                    src={file.url}
                    actions={buttons}
                    hoverable={true}
                    onClick={() => openDialog(file.url)}
                    onDropRow={handleDropRow}
                    draggable={enableDnd && !isUpdating}
                    itemClassName="SchemaImages-item"
                    sx={{
                      boxShadow: 'none',
                      backgroundColor: 'background.neutral',
                      borderColor: 'background.neutral',
                    }}
                    variant="outlined"
                    index={index + 1}
                  >
                    {restFieldSchemas.map((fieldSchema, index) => (
                      <SchemaImagesField
                        key={index}
                        fieldSchema={fieldSchema}
                        resource={resource}
                        getFieldEl={getFieldEl}
                      />
                    ))}
                  </DraggableImagePanel>
                </RecordContextProvider>
              </Grid>
            );
          })}
        </Grid>
      </ValueLocationContextProvider>
      <Dialog maxWidth="md">
        {dialogData &&
          (dialogImageFailed ? (
            <Box
              sx={{
                width: 400,
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.neutral',
              }}
            >
              <Icon icon={IconType.BrokenImage} size={48} sx={{color: 'text.disabled'}} />
            </Box>
          ) : (
            <Box
              component="img"
              src={dialogData}
              width="100%"
              onError={() => setDialogImageFailed(true)}
            />
          ))}
      </Dialog>
    </>
  );
};
