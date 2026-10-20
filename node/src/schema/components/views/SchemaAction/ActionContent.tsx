import React from 'react';
import {Create, CreateProps, useLocaleState} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {NotFound} from '@admin/components/common/NotFound';
import {FormShell} from '@admin/components/views/FormShell';
import {ShowShell} from '@admin/components/views/ShowShell';
import {ViewContent} from '@admin/components/views/ViewContent';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useRecordIdOrUndefined} from '@admin/hooks/useRecordIdOrUndefined';
import {useStableKeys} from '@foundation/hooks/useStableKeys';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import {ViewSchemaBreadcrumbs} from '@schema/components/breadcrumbs/ViewSchemaBreadcrumbs';
import {SchemaFormActions} from '@schema/components/views/SchemaFormActions';
import {SchemaViewToolbarActions} from '@schema/components/views/SchemaViewToolbarActions';
import {MethodSchemaProvider} from '@schema/contexts/MethodSchemaContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {useFormDefaultValues} from '@schema/hooks/useFormDefaultValues';
import {useGetTargetValues} from '@schema/hooks/useGetTargetValues';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {useLocalResourceSchemaRefresh} from '@schema/hooks/useLocalResourceSchemaRefresh';
import {findSaveAction} from '@schema/utils/actionDescriptor';
import {getFormData} from '@schema/utils/api';
import {DataType} from '@typing';
import {ActionSaveContextProvider} from './ActionSaveContext';

export type ActionContentProps = Omit<CreateProps, 'children'> & {
  onSubmit?: SubmitHandler<FieldValues>;
  onPostSubmit?: () => void;
};

export const ActionContent = ({
  transform,
  onSubmit,
  onPostSubmit,
  ...props
}: ActionContentProps) => {
  const refreshSchema = useLocalResourceSchemaRefresh();
  const [locale] = useLocaleState();
  const {data: viewData, changeView, prevView, id} = useSchemaViewRouterContext();
  const {viewSchema, methodSchema, readOnly} = useViewSchemaContext();
  const recordId = useRecordIdOrUndefined(id);

  const resource = useResourceContext();
  const {hasListView, hasShowView} = useGlobalResourceSchemaContext(resource);

  // --------------------------------------------------------------------------
  // Form data
  // --------------------------------------------------------------------------

  const defaultValues = useFormDefaultValues();
  const targetValues = useGetTargetValues();
  const formData = getFormData(targetValues || {}, viewData);

  const transformedFormData = (data: DataType) => {
    if (transform) {
      data = transform(data);
    }
    if (formData) {
      data = {...data, ...formData};
    }
    return data;
  };

  const excludeFields = useStableKeys(formData);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const afterSave = findSaveAction(viewSchema.detail?.bottomActions)?.save?.afterSave;

  const handleSuccess = () => {
    // Redirect to the appropriate view based on the available views and afterSave specification
    refreshSchema();
    switch (afterSave) {
      case 'stay':
        return;
      case 'prev':
        if (prevView()) {
          return;
        }
        break;
      case 'show':
        if (hasShowView && id) {
          changeView({resource, viewName: 'show', viewType: 'show', id});
          return;
        }
        break;
      case 'list':
        if (hasListView) {
          changeView({resource, viewName: 'list', viewType: 'list'});
          return;
        }
        break;
    }
    // Default behavior
    if (!prevView() && hasListView) {
      changeView({resource, viewName: 'list', viewType: 'list'});
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (!viewSchema.detail || !viewSchema.detail.box) return <NotFound />;
  const title = viewSchema.label;
  const toolbarActions = <SchemaViewToolbarActions />;
  const breadcrumbs = <ViewSchemaBreadcrumbs />;
  const box = <SchemaBox schema={viewSchema.detail.box} excludeFields={excludeFields} isRoot />;
  return (
    <Create
      transform={transformedFormData}
      actions={<></>}
      // `component="div"` so the controller adds no `Card` (shadow + radius) — the surface is the
      // inner box `Panel`s, matching `CreateShell`. Without it RA wraps the form in its default paper.
      component="div"
      mutationOptions={{meta: {query: viewData, locale}, onSuccess: handleSuccess}}
      {...props}
    >
      <MethodSchemaProvider schema={methodSchema}>
        <ActionSaveContextProvider id={recordId} handleSuccess={handleSuccess}>
          {readOnly ? (
            // A read-only action view (e.g. a routed list subpage) renders through the `ShowShell`
            // frame, which owns its own `ViewContent` — so it takes the title / breadcrumbs directly
            // rather than being wrapped in a second one.
            <ShowShell title={title} toolbarActions={toolbarActions} breadcrumbs={breadcrumbs}>
              {box}
            </ShowShell>
          ) : (
            <ViewContent title={title} toolbarActions={toolbarActions} breadcrumbs={breadcrumbs}>
              <FormShell
                onSubmit={onSubmit}
                onPostSubmit={onPostSubmit}
                defaultValues={defaultValues}
                formActions={<SchemaFormActions />}
              >
                {box}
              </FormShell>
            </ViewContent>
          )}
        </ActionSaveContextProvider>
      </MethodSchemaProvider>
    </Create>
  );
};
