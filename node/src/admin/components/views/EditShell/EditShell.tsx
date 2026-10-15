import React, {ReactNode} from 'react';
import {Edit, EditProps, Loading, useRecordContext} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {FormShell} from '@admin/components/views/FormShell';
import {ViewContent} from '@admin/components/views/ViewContent';

export type EditShellProps = {
  children?: ReactNode;
  // React Admin `<Edit>` controller props (transform, mutationMode, queryOptions, mutationOptions, …)
  // as plain RA values, so the schema ring configures the controller without leaking a schema type.
  controllerProps?: Omit<EditProps, 'children'>;
  title?: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: ReactNode;
  toolbarActions?: ReactNode;
  formActions?: ReactNode;
  onSubmit?: SubmitHandler<FieldValues>;
  onPostSubmit?: () => void;
  defaultValues?: Record<string, unknown>;
};

type EditShellBodyProps = Omit<EditShellProps, 'controllerProps'>;

// Renders once the `<Edit>` controller has loaded the record (absorbs `RecordLoadingWrapper`): the
// card-less `ViewContent` frame wrapping the form context (`FormShell`).
const EditShellBody = ({
  title,
  subtitle,
  toolbarActions,
  breadcrumbs,
  formActions,
  onSubmit,
  onPostSubmit,
  defaultValues,
  children,
}: EditShellBodyProps) => {
  const record = useRecordContext();
  if (!record) return <Loading />;

  return (
    <ViewContent
      title={title}
      subtitle={subtitle}
      toolbarActions={toolbarActions}
      breadcrumbs={breadcrumbs}
    >
      <FormShell
        onSubmit={onSubmit}
        onPostSubmit={onPostSubmit}
        defaultValues={defaultValues}
        formActions={formActions}
      >
        {children}
      </FormShell>
    </ViewContent>
  );
};

// (C) admin-context shell for the edit view: owns the React Admin `<Edit>` controller (no actions,
// `component="div"` so it adds no card — the surface is the inner `Panel`s) and lays the form out in
// the card-less `ViewContent` frame. Page-vs-dialog is read from `ViewPresentationContext`.
export const EditShell = ({controllerProps, ...content}: EditShellProps) => (
  <Edit actions={false} component="div" {...controllerProps}>
    <EditShellBody {...content} />
  </Edit>
);
