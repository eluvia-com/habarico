import React, {useEffect, useState} from 'react';
import {Identifier, useRecordContext, useTranslate} from 'react-admin';
import {LinkActionTrigger} from '@admin/components/buttons/LinkActionTrigger';
import {ActionTriggerResult, BaseActionTriggerProps} from '@admin/components/buttons/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {ConfirmDialog} from '@design/organisms/ConfirmDialog';
import {NavMode} from '@foundation/utils/navigation';
import {SchemaViewActionTrigger} from '@schema/components/buttons/SchemaViewActionTrigger';
import {useCallAction} from '@schema/hooks/useCallAction';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {ActionSchema, ResourceActionEndpointParameters} from '@schema/types';

// --- SchemaActionTrigger ---

export type SchemaActionTriggerProps = {
  schema: ActionSchema;
  pathname?: string;
  // Forwarded to a view action so a redirect can respect ctrl/cmd/shift navigation and a
  // sidepanel action can dock into the right list panel.
  navMode?: NavMode;
  target?: string;
  // Forwarded to a view action: a same-tab redirect replaces the current history entry.
  replace?: boolean;
} & BaseActionTriggerProps;

export const SchemaActionTrigger = ({
  schema,
  onDone,
  pathname,
  navMode,
  target,
  replace,
}: SchemaActionTriggerProps) => {
  const [wasTriggeredAction, setWasTriggeredAction] = useState(false);
  const [wasConfirmedAction, setWasConfirmedAction] = useState(!schema.confirmDialog);

  const translate = useTranslate();
  const record = useRecordContext();
  const resource = useResourceContext();
  const reference = useResourceContext(
    schema.view?.endpoint?.reference || schema.resource?.endpoint?.reference
  );
  const {getGlobalViewSchema} = useGlobalResourceSchemaContext(reference);

  const recordPk = resource === reference && schema.isDetail ? record?.id : undefined;

  const viewSchema = getGlobalViewSchema(schema.view?.name);

  let viewAction: React.ReactElement | undefined = undefined;

  const handleTrigger = (result?: ActionTriggerResult) => {
    if (onDone) onDone(result);
    setWasTriggeredAction(true);
  };

  if (wasConfirmedAction && !wasTriggeredAction) {
    if (schema.type === 'view' && schema.view && viewSchema) {
      viewAction = (
        <SchemaViewActionTrigger
          viewType={viewSchema.type}
          viewName={schema.view.name}
          actionName={schema.view.endpoint?.actionName}
          reference={reference}
          recordPk={schema.view.endpoint?.recordPk || recordPk}
          mode={schema.view.mode}
          navMode={navMode}
          target={target}
          keepLinkedParent={schema.view.keepLinkedParent}
          dialogWidth={schema.view.dialogWidth}
          onDone={handleTrigger}
          pathname={pathname}
          params={schema.view.parameters}
          replace={replace}
        />
      );
    } else if (schema.type === 'link' && schema.link) {
      viewAction = (
        <LinkActionTrigger
          url={schema.link.url}
          target={schema.link.target}
          onDone={handleTrigger}
        />
      );
    } else if (schema.type === 'resource' && schema.resource) {
      viewAction = (
        <SchemaResourceActionTrigger
          reference={reference}
          data={schema.resource.data}
          recordPk={recordPk}
          endpoint={schema.resource.endpoint}
          onDone={handleTrigger}
        />
      );
    }
  }

  return (
    <>
      {viewAction}
      {schema.confirmDialog && !wasConfirmedAction && (
        <ConfirmDialog
          open
          title={translate(schema.confirmDialog.title, {_: schema.confirmDialog.title})}
          content={translate(schema.confirmDialog.message, {_: schema.confirmDialog.message})}
          confirmLabel={translate('ra.action.confirm', {_: 'Confirm'})}
          cancelLabel={translate('ra.action.cancel', {_: 'Cancel'})}
          onConfirm={() => setWasConfirmedAction(true)}
          onCancel={() => handleTrigger()}
        />
      )}
    </>
  );
};

// --- SchemaResourceActionTrigger ---

export type SchemaResourceActionTriggerProps = {
  endpoint: ResourceActionEndpointParameters;
  reference?: string;
  recordPk?: Identifier;
  data?: Record<string, string | number | boolean>;
} & BaseActionTriggerProps;

type PendingTriggerAction = {
  schema: ActionSchema;
  onDone?: (result?: ActionTriggerResult) => void;
};

export const SchemaResourceActionTrigger = ({
  endpoint,
  reference,
  data,
  recordPk,
  onDone,
}: SchemaResourceActionTriggerProps) => {
  const resource = useResourceContext(reference);
  const [pendingTrigger, setPendingTrigger] = useState<PendingTriggerAction | undefined>(undefined);

  const {callAction} = useCallAction({
    resource,
    path: endpoint.path,
    method: endpoint.method,
    data: {id: endpoint.recordPk || recordPk, data: data},
    onTriggerAction: ({schema, onDone: triggerOnDone}) => {
      setPendingTrigger({schema, onDone: triggerOnDone});
    },
    onDone,
  });

  useEffect(() => {
    callAction().then();
  }, [callAction]);

  return (
    <>
      {pendingTrigger && (
        <SchemaActionTrigger
          schema={pendingTrigger.schema}
          onDone={(result) => {
            setPendingTrigger(undefined);
            pendingTrigger.onDone?.(result);
          }}
        />
      )}
    </>
  );
};
