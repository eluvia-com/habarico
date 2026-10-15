import React, {ReactNode} from 'react';
import {EditProps, useLocaleState, useNotify} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {NotFound} from '@admin/components/common/NotFound';
import {EditShell} from '@admin/components/views/EditShell';
import {ShowShell} from '@admin/components/views/ShowShell';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useStableKeys} from '@foundation/hooks/useStableKeys';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import {ViewSchemaBreadcrumbs} from '@schema/components/breadcrumbs/ViewSchemaBreadcrumbs';
import {SchemaFormActions} from '@schema/components/views/SchemaFormActions';
import {SchemaViewTitle} from '@schema/components/views/SchemaViewTitle';
import {SchemaViewToolbarActions} from '@schema/components/views/SchemaViewToolbarActions';
import {MethodSchemaProvider} from '@schema/contexts/MethodSchemaContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {useFormDefaultValues} from '@schema/hooks/useFormDefaultValues';
import {useGetTargetValues} from '@schema/hooks/useGetTargetValues';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {useLocalResourceSchemaRefresh} from '@schema/hooks/useLocalResourceSchemaRefresh';
import {useTriggerAction} from '@schema/hooks/useTriggerAction';
import {HabRecord} from '@schema/types';
import {getFormData} from '@schema/utils/api';
import {DataType} from '@typing';
import {useAfterSaveRedirect} from '../hooks/useAfterSaveRedirect';
import {EditToolbarActions} from './EditToolbarActions';

export type EditContentProps = Omit<EditProps, 'children'> & {
  onSubmit?: SubmitHandler<FieldValues>;
  onPostSubmit?: () => void;
  title?: ReactNode;
  toolbarActions?: ReactNode;
  formActions?: ReactNode;
};

export const EditContent = ({
  transform,
  onSubmit,
  onPostSubmit,
  title = <SchemaViewTitle />,
  toolbarActions = <SchemaViewToolbarActions />,
  formActions = <SchemaFormActions />,
  ...props
}: EditContentProps) => {
  const notify = useNotify();
  const {data: viewData} = useSchemaViewRouterContext();
  // Locale threaded into the record read (query key → refetch on language switch) and the save
  // response, so the loaded/updated record's per-record `meta` (`schema.actions`, `repr`, …) is
  // localized to the current language (HAB-782).
  const [locale] = useLocaleState();
  const {viewSchema, methodSchema, readOnly} = useViewSchemaContext();
  const resource = useResourceContext();
  const {hasShowView, hasListView} = useGlobalResourceSchemaContext(resource);
  const {getRedirect} = useAfterSaveRedirect({
    hasShowView,
    hasListView,
    redirectDefault: (id) =>
      hasShowView ? {resource, viewName: 'show', viewType: 'show', id, replace: true} : undefined,
  });
  const {triggerActionElement, triggerAction} = useTriggerAction();
  const refreshSchema = useLocalResourceSchemaRefresh();

  // --------------------------------------------------------------------------
  // Form data
  // --------------------------------------------------------------------------

  const defaultValues = useFormDefaultValues();
  const targetValues = useGetTargetValues();
  const formData = getFormData(targetValues || {}, viewData);

  const transformFormData = (data: DataType) => {
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

  const handleSuccess = (data: HabRecord) => {
    const {redirect, replace} = getRedirect(data.id);

    notify('ra.notification.updated', {messageArgs: {smart_count: 1}});
    refreshSchema();
    if (data.meta?.triggerAction) {
      // A trigger that navigates itself (e.g. back to the parent record) stands in for the after-save
      // redirect, and replaces the history entry the same way, so "back" does not return to a saved
      // form. Its link is resolved against the current route, not the after-save target, which is
      // never reached.
      triggerAction({
        schema: data.meta.triggerAction,
        onDone: (result) => {
          if (!result?.navigated) redirect();
        },
        replace,
      });
    } else {
      redirect();
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (viewSchema.detail === undefined) return <NotFound />;

  const box = <SchemaBox schema={viewSchema.detail.box} excludeFields={excludeFields} isRoot />;

  // `readOnly` is only ever true for list/show view types, so this branch is unreachable for an edit
  // view; kept for safety, it renders the read-only detail via `ShowShell` (the schema ring picks
  // the shell — the admin shells have no `readOnly` concept).
  if (readOnly) {
    return (
      <MethodSchemaProvider schema={methodSchema}>
        <ShowShell
          controllerProps={{queryOptions: {meta: {query: viewData, locale}}}}
          title={title}
          toolbarActions={toolbarActions}
          breadcrumbs={<ViewSchemaBreadcrumbs />}
        >
          {box}
        </ShowShell>
      </MethodSchemaProvider>
    );
  }

  return (
    <MethodSchemaProvider schema={methodSchema}>
      <EditShell
        controllerProps={{
          transform: transformFormData,
          mutationMode: 'pessimistic',
          queryOptions: {meta: {query: viewData, locale}},
          mutationOptions: {meta: {query: viewData, locale}, onSuccess: handleSuccess},
          ...props,
        }}
        title={title}
        toolbarActions={toolbarActions}
        breadcrumbs={<ViewSchemaBreadcrumbs />}
        formActions={formActions}
        onSubmit={onSubmit}
        onPostSubmit={onPostSubmit}
        defaultValues={defaultValues}
      >
        {triggerActionElement}
        {/* Portals default header actions (a detail switch, plus Save on a page) when the edit view
            has no toolbar actions — rendered here so they stay inside the form context. */}
        <EditToolbarActions />
        {box}
      </EditShell>
    </MethodSchemaProvider>
  );
};
