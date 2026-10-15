import {HttpError} from 'react-admin';
import {DataType} from '@typing';

// Shape of a single backend error entry (from the API error envelope).
export type ApiError = {
  error: string;
  message: string;
  source: string | null;
  status: number;
  timestamp: string;
};

// Best-effort extraction of a human-readable message from an unknown thrown value: a raw string is
// returned as-is, an object with a `message` yields it, otherwise undefined.
export const extractErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as {message?: string}).message;
  }
  return undefined;
};

// Turns a backend error envelope into a react-admin `HttpError`: on a 422 it maps field errors
// (`source` → dotted field path, remapped via `mapFields`) into `body.errors` and picks a main
// message; otherwise it throws a plain `HttpError` with the given status.
export const handleErrorResponse = (
  data: DataType | undefined,
  status: number,
  defaultMainErrorMessage?: string,
  mapFields: {[key: string]: string} = {}
) => {
  const errors = data?.errors as ApiError[] | undefined;

  if (errors) {
    if (status === 422) {
      let mainErrorMessage = defaultMainErrorMessage;
      const errorMessages: {[key: string]: string} = {};
      errors.forEach((error) => {
        let key = error.source?.replace(new RegExp('__', 'g'), '.') || '';
        if (mapFields[key]) {
          key = mapFields[key];
        }
        if (!key || key == 'non_field_errors') mainErrorMessage = error.message;
        else errorMessages[key] = error.message;
      });
      if (!mainErrorMessage) {
        mainErrorMessage = Object.values(errorMessages)[0];
      }
      throw new HttpError(mainErrorMessage, 422, {errors: errorMessages});
    }
  }
  throw new HttpError(defaultMainErrorMessage, status);
};
