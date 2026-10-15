import {createContext, useContext} from 'react';
import {FormInputSourcesContextType, FormInputSourcesRegistrationType} from './types';

export const FormInputSourcesContext = createContext<FormInputSourcesContextType | undefined>(
  undefined
);

// `register`/`unregister` are stable callbacks, so this context's value never changes after mount —
// an input subscribing here pays nothing. `FormInputSourcesContext` above holds the `sources` list,
// which changes with every registration.
export const FormInputSourcesRegistrationContext = createContext<
  FormInputSourcesRegistrationType | undefined
>(undefined);

/**
 * The registered-sources list plus the registration callbacks. Re-renders the caller on every
 * registration, so only for a caller that needs the list itself (e.g. the AI assistant dialog); an
 * input that only registers itself uses `useFormInputSourcesRegistration`.
 */
export const useFormInputSourcesContext = () => {
  const ctx = useContext(FormInputSourcesContext);
  const registration = useContext(FormInputSourcesRegistrationContext);
  return {
    sources: ctx?.sources ?? [],
    register: registration?.register,
    unregister: registration?.unregister,
  };
};

/** The registration callbacks only — a stable value, so subscribing costs nothing after mount. */
export const useFormInputSourcesRegistration = () => {
  const registration = useContext(FormInputSourcesRegistrationContext);
  return {
    register: registration?.register,
    unregister: registration?.unregister,
  };
};
