import React, {ReactNode} from 'react';
import {Create, CreateProps} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {FormShell} from '@admin/components/views/FormShell';
import {ViewContent} from '@admin/components/views/ViewContent';

export type CreateShellProps = {
  children?: ReactNode;
  // React Admin `<Create>` controller props (transform, mutationOptions, …) as plain RA values, so
  // the schema ring configures the controller without leaking a schema type into this shell.
  controllerProps?: Omit<CreateProps, 'children'>;
  title?: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: ReactNode;
  toolbarActions?: ReactNode;
  formActions?: ReactNode;
  onSubmit?: SubmitHandler<FieldValues>;
  onPostSubmit?: () => void;
  defaultValues?: Record<string, unknown>;
};

// (C) admin-context shell for the create view: owns the React Admin `<Create>` controller (no
// actions, `component="div"` so it adds no card — the surface is the inner `Panel`s) and lays the
// form out in the card-less `ViewContent` frame. A create has no record to load, so — unlike
// `EditShell` — there is no loading gate. Page-vs-dialog is read from `ViewPresentationContext`.
export const CreateShell = ({
  controllerProps,
  title,
  subtitle,
  toolbarActions,
  breadcrumbs,
  formActions,
  onSubmit,
  onPostSubmit,
  defaultValues,
  children,
}: CreateShellProps) => (
  <Create actions={false} component="div" {...controllerProps}>
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
  </Create>
);
