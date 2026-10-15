import {useState} from 'react';
import {HttpError, useNotify} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {extractErrorMessage} from '@admin/utils/api';

export const useSubmitForm = <T extends FieldValues = FieldValues>(
  onSubmit: SubmitHandler<T>,
  onSuccess?: () => void,
  onError?: (error: Error) => void,
  successMessage?: string | null,
  errorMessage?: string,
  tooManyRequestsMessage?: string
) => {
  const [isLoading, setIsLoading] = useState(false);
  const notify = useNotify();

  const handleSubmit = async (data: FieldValues) => {
    setIsLoading(true);
    try {
      await onSubmit(data as T);
      if (successMessage !== null)
        notify(successMessage || 'ra.message.successfully_done', {type: 'success'});
      onSuccess?.();
    } catch (error) {
      if (tooManyRequestsMessage && error instanceof HttpError && error.status === 429) {
        notify(tooManyRequestsMessage, {type: 'error'});
        onError?.(error as Error);
      } else if (error instanceof HttpError && (error as HttpError).body?.errors) {
        const httpError = error as HttpError;
        if (Object.keys(httpError.body.errors).length === 0) {
          notify(extractErrorMessage(error) ?? (errorMessage || 'ra.message.invalid_form'), {
            type: 'error',
            messageArgs: {
              _: extractErrorMessage(error),
            },
          });
        }
        onError?.(httpError);
        return httpError.body.errors;
      } else {
        notify(extractErrorMessage(error) ?? (errorMessage || 'ra.message.invalid_form'), {
          type: 'error',
          messageArgs: {
            _: extractErrorMessage(error),
          },
        });
        onError?.(error as Error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  return {handleSubmit, isLoading};
};
