import React from 'react';
import {useCallback, useEffect, useRef} from 'react';
import {HttpError, Identifier, SaveContextProvider} from 'react-admin';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {useCallAction} from '@schema/hooks/useCallAction';
import {useTriggerAction} from '@schema/hooks/useTriggerAction';
import {DataType} from '@typing';

type ActionSaveContextProviderProps = {
  children: React.ReactNode;
  id?: Identifier;
  handleSuccess?: () => void;
};

export const ActionSaveContextProvider = ({
  children,
  handleSuccess,
  id,
}: ActionSaveContextProviderProps) => {
  const resource = useResourceContext();

  const {viewSchema} = useViewSchemaContext();

  const path = viewSchema.endpoint?.path || viewSchema.endpoint.reference?.actionName + '/';

  const {triggerActionElement, triggerAction} = useTriggerAction();
  // Set when the save's trigger action navigated itself: it then stands in for `handleSuccess`'s
  // redirect, which would otherwise run once the trigger is gone and override its navigation.
  const triggerNavigatedRef = useRef(false);
  const handleTriggerAction = useCallback<typeof triggerAction>(
    ({onDone, ...props}) =>
      triggerAction({
        ...props,
        onDone: (result) => {
          if (result?.navigated) triggerNavigatedRef.current = true;
          onDone?.(result);
        },
      }),
    [triggerAction]
  );
  const {isLoading, isRunning, isStarted, callAction, isError} = useCallAction({
    resource,
    path,
    method: viewSchema.endpoint.method,
    onError: false,
    onTriggerAction: handleTriggerAction,
  });

  const save = (data: DataType) => {
    triggerNavigatedRef.current = false;
    return callAction({data: data, id: id}).catch((error) => {
      if ((error as HttpError).body?.errors != null) {
        return (error as HttpError).body.errors;
      }
    });
  };

  useEffect(() => {
    if (
      isStarted &&
      !isLoading &&
      !isRunning &&
      !triggerActionElement &&
      !isError &&
      !triggerNavigatedRef.current
    ) {
      handleSuccess?.();
    }
  }, [isStarted, isRunning, isLoading, isError, handleSuccess, id, triggerActionElement]);

  return (
    <SaveContextProvider
      value={{save, saving: isLoading || isRunning, mutationMode: 'pessimistic'}}
    >
      {children}
      {triggerActionElement}
    </SaveContextProvider>
  );
};
