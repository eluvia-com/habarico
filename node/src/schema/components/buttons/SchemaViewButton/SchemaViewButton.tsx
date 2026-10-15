import React, {useState} from 'react';
import {Identifier, useRecordContext} from 'react-admin';
import {
  ActionButton,
  ActionButtonProps,
  ActionButtonWithChoices,
  ActionChoice,
} from '@admin/components/buttons/ActionButton';
import {NavMode, getNavigationMode} from '@foundation/utils/navigation';
import {SchemaViewActionTrigger} from '@schema/components/buttons/SchemaViewActionTrigger';
import {ActionViewChoice, ViewModeType, ViewType} from '@schema/types';
import {DEFAULT_VIEW_ICONS} from '../constants';

export type SchemaViewButtonProps = Omit<ActionButtonProps, 'type'> & {
  viewType: ViewType;
  viewName: string;
  actionName?: string;
  reference?: string;
  recordPk?: Identifier;
  target?: string;
  keepLinkedParent?: boolean;
  mode?: ViewModeType;
  dialogWidth?: string;
  choices?: ActionViewChoice[];
  params?: Record<string, string>;
  onClose?: () => void;
};

type Trigger = {navMode: NavMode; params?: Record<string, string>; nonce: number};

// A button that opens a target view on click. The presentation (sidepanel / modal / redirect, incl.
// the dialog and in-dialog swap) is fully resolved and performed by SchemaViewActionTrigger, which is
// mounted on click - so this component only forwards the action's own `mode` (undefined when the
// action does not set one) and renders the button.
export const SchemaViewButton = ({
  viewType,
  viewName,
  icon = DEFAULT_VIEW_ICONS[viewType],
  reference,
  target,
  keepLinkedParent,
  recordPk,
  choices,
  mode,
  dialogWidth,
  actionName,
  params,
  onClose,
  ...rest
}: SchemaViewButtonProps) => {
  const record = useRecordContext();

  const [trigger, setTrigger] = useState<Trigger | undefined>(undefined);

  const fireTrigger = (e: React.MouseEvent, choiceParams?: Record<string, string>) => {
    setTrigger((prev) => ({
      navMode: getNavigationMode(e),
      params: params || choiceParams,
      nonce: (prev?.nonce ?? 0) + 1,
    }));
  };

  // `ActionViewChoice` (schema) mapped onto the admin-layer, schema-free `ActionChoice`: the label is
  // kept and the view parameters ride along in `value`.
  const actionChoices: ActionChoice[] | undefined = choices?.map((choice) => ({
    label: choice.label,
    value: choice.parameters,
  }));

  return (
    <>
      {trigger && (
        <SchemaViewActionTrigger
          key={trigger.nonce}
          viewType={viewType}
          viewName={viewName}
          actionName={actionName}
          reference={reference}
          recordPk={recordPk}
          mode={mode}
          navMode={trigger.navMode}
          target={target}
          keepLinkedParent={keepLinkedParent}
          dialogWidth={dialogWidth}
          params={trigger.params}
          onDone={() => {
            setTrigger(undefined);
            if (onClose) onClose();
          }}
        />
      )}
      {actionChoices ? (
        <ActionButtonWithChoices
          choices={actionChoices}
          icon={icon}
          {...rest}
          onSelect={(e, choice) =>
            fireTrigger(e, choice.value as Record<string, string> | undefined)
          }
        />
      ) : (
        <ActionButton
          className={
            recordPk ? `action-${viewName}-${record?.id || recordPk}` : `action-${viewName}`
          }
          {...rest}
          onClick={(e) => fireTrigger(e)}
          icon={icon}
        />
      )}
    </>
  );
};
