import React from 'react';
import {
  InfiniteList,
  ReferenceManyField,
  useLocaleState,
  useRecordContext,
  useTranslate,
} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {ErrorPage} from '@admin/components/common/ErrorPage';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {IconType} from '@design/atoms/Icon';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {Alert, Skeleton} from '@mui/material';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {MethodSchemaProvider} from '@schema/contexts/MethodSchemaContext';
import {useGetLocalResourceSchema} from '@schema/hooks/useGetLocalResourceSchema';
import {HabRecord} from '@schema/types';
import {convertApiSortToRaSort} from '@schema/utils/api';
import {FIELD_DEFAULT, FieldSelection} from '@schema/utils/fieldSelection';
import {resourceKey} from '@schema/utils/resourceReference';
import {SchemaGalleryContent} from './SchemaGalleryContent';

export const SchemaGalleryBox = ({schema, label = schema.label, isRoot}: SchemaBoxProps) => {
  const record = useRecordContext<HabRecord>();
  const resource = useResourceContext();
  const translate = useTranslate();

  if (!schema.gallery) {
    throw new Error('SchemaGalleryBox requires a gallery schema');
  }

  const gallerySchema = schema.gallery;
  const reference = useResourceContext(resourceKey(gallerySchema.reference));
  const [locale] = useLocaleState();
  const isLast = useIsLastPanel();
  const card = useBoxCard(schema, Boolean(label), isRoot);

  const schemaParams = {
    ...gallerySchema.reference.params,
    ...(record && gallerySchema.target
      ? {_target: JSON.stringify({[gallerySchema.target]: record.id})}
      : {}),
    _source: JSON.stringify({[resource]: record?.id}),
  };

  const {isLoading, isError, error, getMethodSchema} = useGetLocalResourceSchema({
    resource: reference,
    params: schemaParams,
  });
  const methodSchema = getMethodSchema('get');

  const fieldSelection: FieldSelection = {
    [gallerySchema.imageField]: FIELD_DEFAULT,
  };

  const filter = {...gallerySchema.extraFilters};
  if (gallerySchema.target && record) {
    filter[gallerySchema.target] = record.id;
  }

  const sort = convertApiSortToRaSort(gallerySchema.defaultSorting);

  if (!record) return null;
  if (isLoading) return <Skeleton variant="rounded" height={200} />;
  if (isError) return <ErrorPage error={error} />;
  if (!methodSchema)
    return <Alert severity="error">{translate('ra.notification.loading_data_error')}</Alert>;

  let listElement = (
    <LocalResourceSchemaProvider resource={reference} params={schemaParams}>
      <MethodSchemaProvider schema={methodSchema}>
        <InfiniteList
          component="div"
          storeKey={`gallery-${resource}-${reference}`}
          disableSyncWithLocation
          queryOptions={{meta: {locale, fields: fieldSelection}}}
          actions={false}
          pagination={false}
          sort={sort}
          filter={filter}
          empty={false}
          resource={reference}
        >
          <SchemaGalleryContent imageField={gallerySchema.imageField} />
        </InfiniteList>
      </MethodSchemaProvider>
    </LocalResourceSchemaProvider>
  );

  if (gallerySchema.target) {
    listElement = (
      <ReferenceManyField
        reference={reference}
        target={gallerySchema.target}
        source="id"
        sort={sort}
        perPage={100}
        filter={gallerySchema.extraFilters}
        queryOptions={{meta: {locale}}}
      >
        {listElement}
      </ReferenceManyField>
    );
  }

  const hasToolbarActions = !!schema.toolbarActions?.length;
  const hasBottomActions = !!schema.bottomActions?.length;

  return (
    <BoxLayout
      schema={schema}
      card={card}
      label={label ? <DynamicText>{label}</DynamicText> : undefined}
      // A gallery box always carries the "image" icon in its header, tinted secondary.
      icon={IconType.Image}
      iconColor="secondary"
      // The gallery sits in a small (8px) gutter rather than full-bleed — override the `gallery`
      // type's flush default so the image has an even inset inside the card (matches the design).
      paddingSize="small"
      flush={false}
      action={
        hasToolbarActions ? (
          <SchemaButtons
            size="small"
            variant="contained"
            descriptors={schema.toolbarActions}
            target={gallerySchema.target}
          />
        ) : undefined
      }
      footerRight={
        hasBottomActions ? (
          <SchemaButtons
            size="small"
            variant="contained"
            descriptors={schema.bottomActions}
            target={gallerySchema.target}
          />
        ) : undefined
      }
      fullHeight={isLast}
    >
      {listElement}
    </BoxLayout>
  );
};
