import {useCallback, useEffect, useRef, useState} from 'react';
import {
  HttpError,
  NotificationType,
  useDataProvider,
  useLocaleState,
  useNotify,
  useRefresh,
} from 'react-admin';
import {ActionTriggerResult} from '@admin/components/buttons/types';
import {useLocalResourceSchemaRefresh} from '@schema/hooks/useLocalResourceSchemaRefresh';
import {ServiceDataProvider} from '@schema/providers/types';
import {ActionResultMeta, ActionSchema, RequestMethodType} from '@schema/types';
import {ActionParams, DataType} from '@typing';

type OnTriggerActionProps = {
  schema: ActionSchema;
  onDone?: (result?: ActionTriggerResult) => void;
};

type UseCallActionProps = {
  resource: string;
  path?: string;
  method: RequestMethodType;
  data?: ActionParams;
  isBackground?: boolean;
  onDone?: (result?: ActionTriggerResult) => void;
  onTriggerAction?: (props: OnTriggerActionProps) => void;
  onError?: ((error: HttpError) => void) | false;
  onResponse?: ((data?: ActionResultMeta) => void) | null;
};

export const useCallAction = ({
  resource,
  path,
  method,
  data: dataProp,
  isBackground,
  onDone,
  onTriggerAction,
  ...props
}: UseCallActionProps) => {
  const refresh = useRefresh();
  const refreshSchema = useLocalResourceSchemaRefresh();

  const [isStarted, setIsStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(!!isBackground);
  const [isError, setIsError] = useState(false);
  const [countCalls, setCountCalls] = useState(0);
  const [data, setData] = useState<ActionParams | undefined>(dataProp);

  // This is used to generate a unique key for the post action element
  const callId = useRef<string | undefined>(undefined);

  const dataProvider = useDataProvider<ServiceDataProvider>();
  const notify = useNotify();
  const [locale] = useLocaleState();

  const handleError = useCallback(
    (error: HttpError) => {
      notify(error.message || 'ra.notification.http_error', {
        type: 'error',
      });
    },
    [notify]
  );

  const handleNotifyTask = useCallback(
    (data?: ActionResultMeta) => {
      let notificationType: NotificationType = 'success';
      const dataMessage = data?.message;
      let notificationMessage = data?.message || 'ra.message.action_successful';

      if (data?.state === 'running') {
        notificationType = 'info';
        notificationMessage = data?.message || 'ra.message.action_running';
      } else if (data?.state === 'error') {
        notificationType = 'error';
        notificationMessage = data?.message || 'ra.message.action_error';
      }

      notify(notificationMessage, {
        type: notificationType,
        messageArgs: {
          _: dataMessage,
        },
        autoHideDuration: 2000,
      });
    },
    [notify]
  );

  const {onError = handleError, onResponse = handleNotifyTask} = props;

  const handleActionStateSuccess = useCallback(
    (resp: {data: unknown}) => {
      const meta =
        resp.data && typeof resp.data === 'object' && 'meta' in resp.data
          ? (resp.data.meta as ActionResultMeta)
          : undefined;

      if (meta?.state === 'running') {
        setIsRunning(true);
        setCountCalls((prevState) => prevState + 1);
      } else {
        if (isStarted) {
          onResponse?.(meta);
          if (meta?.triggerAction) {
            onTriggerAction?.({schema: meta.triggerAction, onDone});
          } else onDone?.();
        }
        setIsRunning(false);
        setCountCalls(0);
      }
      setIsLoading(false);
    },
    [isStarted, onResponse, onTriggerAction, onDone, setIsRunning, setCountCalls, setIsLoading]
  );

  const handleActionStateError = useCallback(
    (error: unknown) => {
      setIsRunning(false);
      setCountCalls(0);
      if (onError) onError(error as HttpError);
      setIsError(true);
      setIsLoading(false);
    },
    [onError, setIsRunning, setCountCalls, setIsError, setIsLoading]
  );

  const callGetActionState = useCallback(
    () =>
      dataProvider
        .callAction(resource, 'get', path, {id: data?.id, meta: {locale}})
        .then(handleActionStateSuccess)
        .catch(handleActionStateError),
    [dataProvider, path, data, resource, locale, handleActionStateSuccess, handleActionStateError]
  );

  const callAction = useCallback(
    async (actionData?: ActionParams) => {
      let httpError: HttpError | undefined = undefined;
      let respData: DataType | undefined = undefined;

      const call = async () => {
        try {
          const resp = await dataProvider.callAction(resource, method, path, {
            ...(actionData || data),
            meta: {locale},
          });
          respData = resp.data as DataType;

          const meta =
            respData && 'meta' in respData ? (respData.meta as ActionResultMeta) : undefined;

          onResponse?.(meta);

          if (meta?.triggerAction) {
            onTriggerAction?.({schema: meta.triggerAction, onDone});
          } else {
            onDone?.();
          }

          if (meta?.state === 'running') {
            setIsRunning(true);
            if (actionData) {
              setData(actionData);
            }
          } else if (!meta || meta.state !== 'error') {
            refresh();
            refreshSchema();
          }
        } catch (error) {
          httpError = error as HttpError;
          if (onError) onError(httpError);
          setIsError(true);
        }
        setIsLoading(false);
        if (httpError) throw httpError;
        return respData;
      };
      callId.current = crypto.randomUUID();
      setIsError(false);
      setIsLoading(true);
      setIsStarted(true);
      return await call();
    },
    [
      setIsError,
      setIsStarted,
      setIsLoading,
      dataProvider,
      data,
      resource,
      method,
      path,
      locale,
      onError,
      onResponse,
      onDone,
      onTriggerAction,
      refresh,
      refreshSchema,
    ]
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isRunning) {
      timer = setTimeout(() => {
        callGetActionState().then();
      }, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, countCalls, callGetActionState]);

  useEffect(() => {
    if (isBackground && !isStarted) {
      dataProvider
        .callAction(resource, 'get', path, {id: data?.id, meta: {locale}})
        .then(handleActionStateSuccess)
        .catch(handleActionStateError);
    }
  }, [
    isBackground,
    isStarted,
    dataProvider,
    path,
    data,
    resource,
    locale,
    handleActionStateSuccess,
    handleActionStateError,
  ]);

  return {isLoading, isRunning, isStarted, isError, callAction};
};
