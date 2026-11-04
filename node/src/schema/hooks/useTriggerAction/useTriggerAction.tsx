import React, {useCallback, useState} from 'react';
import {ActionTriggerResult} from '@admin/components/buttons/types';
import {NavMode} from '@foundation/utils/navigation';
import {SchemaActionTrigger} from '@schema/components/buttons/SchemaActionTrigger';
import {ActionSchema} from '@schema/types';
import {ActionContext} from '@schema/utils/actionDescriptor';

export type TriggerActionProps = {
  schema: ActionSchema;
  pathname?: string;
  onDone?: (result?: ActionTriggerResult) => void;
  // Forwarded to a view action: navMode drives ctrl/cmd/shift redirect, target the sidepanel dock,
  // replace whether a same-tab redirect replaces the current history entry.
  navMode?: NavMode;
  target?: string;
  replace?: boolean;
  actionContext?: ActionContext;
};

export const useTriggerAction = () => {
  const [triggerActionElement, setTriggerActionElement] = useState<React.ReactElement | undefined>(
    undefined
  );

  const handleTrigger = useCallback(() => {
    setTriggerActionElement(undefined);
  }, []);

  const triggerAction = useCallback(
    ({schema, pathname, onDone, navMode, target, replace, actionContext}: TriggerActionProps) => {
      setTriggerActionElement(
        <SchemaActionTrigger
          schema={schema}
          onDone={(result) => {
            handleTrigger();
            if (onDone) onDone(result);
          }}
          pathname={pathname}
          navMode={navMode}
          target={target}
          replace={replace}
          actionContext={actionContext}
        />
      );
    },
    [setTriggerActionElement, handleTrigger]
  );

  return {triggerActionElement, triggerAction};
};
