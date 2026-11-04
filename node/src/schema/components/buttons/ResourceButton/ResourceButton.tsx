import React from 'react';
import {Identifier} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {Icon, IconType} from '@design/atoms/Icon';
import {useCallAction} from '@schema/hooks/useCallAction';
import {useTriggerAction} from '@schema/hooks/useTriggerAction';
import {ResourceActionEndpointParameters} from '@schema/types';

export type ResourceButtonProps = ActionButtonProps & {
  endpoint: ResourceActionEndpointParameters;
  reference?: string;
  recordPk?: Identifier;
  data?: Record<string, string | number | boolean>;
  isBackground?: boolean;
};

export const ResourceButton = ({
  endpoint,
  reference,
  data,
  recordPk,
  onSuccess,
  isBackground = false,
  icon = <Icon icon={IconType.Task} />,
  ...rest
}: ResourceButtonProps) => {
  const resource = useResourceContext(reference);
  const {triggerActionElement, triggerAction} = useTriggerAction();
  const {isLoading, isRunning, callAction} = useCallAction({
    resource,
    path: endpoint.path,
    method: endpoint.method,
    data: {id: endpoint.reference?.recordPk || recordPk, data: data},
    isBackground,
    onTriggerAction: triggerAction,
  });

  const handleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    await callAction();
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <ActionButton onClick={handleClick} loading={isLoading || isRunning} icon={icon} {...rest} />
      {triggerActionElement}
    </>
  );
};
