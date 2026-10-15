import React, {ReactNode} from 'react';
import {
  Loading,
  RaRecord,
  RecordContextProvider,
  Show,
  ShowProps,
  useRecordContext,
} from 'react-admin';
import {ViewContent} from '@admin/components/views/ViewContent';
import {RootRecordContextProvider} from '@admin/contexts/RootRecordContext';

export type ShowShellProps = {
  children?: ReactNode;
  record?: RaRecord;
  // React Admin `<Show>` controller props (id, queryOptions, …). Schema-agnostic plain RA values so
  // the schema ring can configure the controller without leaking a schema type into this shell.
  controllerProps?: Omit<ShowProps, 'children'>;
  title?: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: ReactNode;
  toolbarActions?: ReactNode;
  bottomActions?: ReactNode;
};

type ShowShellContentProps = Omit<ShowShellProps, 'controllerProps'>;

// Reads the record the `<Show>` controller loaded and lays it out in the card-less `ViewContent`
// frame, re-providing it as both the root record (consumed by nested field boxes) and the record
// context. Renders the RA skeleton until the record is available (absorbs `RecordLoadingWrapper`).
const ShowShellContent = ({
  record,
  title,
  subtitle,
  toolbarActions,
  breadcrumbs,
  bottomActions,
  children,
}: ShowShellContentProps) => {
  const contextRecord = useRecordContext();
  const resolved = record ?? contextRecord;
  if (!resolved) return <Loading />;

  return (
    <RootRecordContextProvider value={resolved}>
      <RecordContextProvider value={resolved}>
        <ViewContent
          title={title}
          subtitle={subtitle}
          toolbarActions={toolbarActions}
          breadcrumbs={breadcrumbs}
          bottomActions={bottomActions}
        >
          {children}
        </ViewContent>
      </RecordContextProvider>
    </RootRecordContextProvider>
  );
};

// (C) admin-context shell for the show view: owns the React Admin `<Show>` controller (its own
// actions disabled and `component="div"` so it adds no card — the surface is the inner `Panel`s) and
// hands the loaded record to `ViewContent`. Page-vs-dialog is read from `ViewPresentationContext`.
export const ShowShell = ({controllerProps, ...content}: ShowShellProps) => (
  <Show actions={false} component="div" {...controllerProps}>
    <ShowShellContent {...content} />
  </Show>
);
