import React, {ReactNode} from 'react';
import {ShowProps, useLocaleState} from 'react-admin';
import {NotFound} from '@admin/components/common/NotFound';
import {ShowShell} from '@admin/components/views/ShowShell';
import {useStableKeys} from '@foundation/hooks/useStableKeys';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import {ViewSchemaBreadcrumbs} from '@schema/components/breadcrumbs/ViewSchemaBreadcrumbs';
import {SchemaShowBottomActions} from '@schema/components/views/SchemaShowBottomActions';
import {SchemaViewTitle} from '@schema/components/views/SchemaViewTitle';
import {SchemaViewToolbarActions} from '@schema/components/views/SchemaViewToolbarActions';
import {MethodSchemaProvider} from '@schema/contexts/MethodSchemaContext';
import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';

export type ShowContentProps = Omit<ShowProps, 'children'> & {
  title?: ReactNode;
  toolbarActions?: ReactNode;
};

export const ShowContent = ({
  title = <SchemaViewTitle />,
  toolbarActions = <SchemaViewToolbarActions />,
  ...props
}: ShowContentProps) => {
  const {viewSchema, methodSchema} = useViewSchemaContext();
  const {data: viewData} = useSchemaViewRouterContext();

  // Thread the active locale into the data query's `meta` so it (a) lands in the RA query key —
  // a language switch refetches the record — and (b) reaches `dataProvider.getOne` as
  // `params.meta.locale`, letting the backend localize the per-record `meta` (`schema.actions`,
  // `repr`, …) that the detail toolbar reads (HAB-782).
  const [locale] = useLocaleState();

  // --------------------------------------------------------------------------
  // Form data
  // --------------------------------------------------------------------------

  const parentDescriptors = useParentResourceDescriptorsContext();
  const lastParentDescriptor = parentDescriptors[parentDescriptors.length - 1];

  const formData =
    lastParentDescriptor && lastParentDescriptor.target && lastParentDescriptor.recordId
      ? {
          [lastParentDescriptor.target]: lastParentDescriptor.recordId,
        }
      : {};

  const excludeFields = useStableKeys(formData);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (viewSchema.detail === undefined) return <NotFound />;
  return (
    <MethodSchemaProvider schema={methodSchema}>
      <ShowShell
        controllerProps={{...props, queryOptions: {meta: {query: viewData, locale}}}}
        title={title}
        toolbarActions={toolbarActions}
        breadcrumbs={<ViewSchemaBreadcrumbs />}
        bottomActions={<SchemaShowBottomActions />}
      >
        <SchemaBox schema={viewSchema.detail.box} excludeFields={excludeFields} isRoot />
      </ShowShell>
    </MethodSchemaProvider>
  );
};
