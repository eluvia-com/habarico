import {ReactNode, createContext, useContext} from 'react';

// A form-scoped registry of extra nodes (typically dialogs/overlays) that a component deep in the
// form subtree registers by id, and which `FormShell` renders at the form root — so the node lives
// inside the form context (react-hook-form / record) without being nested where the registrant sits.
// `FormShell` is the renderer; the registrant side is open to anyone — a button that opens an
// assistant, a wizard step, anything that needs its overlay at the form root.
export type FormExtensionsContextValue = {
  formExtensions: Record<string, ReactNode>;
  registerFormExtension: (id: string, node: ReactNode) => void;
  unregisterFormExtension: (id: string) => void;
};

const noop = () => {};

// Safe default so consumers work without a provider (e.g. schema-free `BaseAdmin` stories): an empty
// registry and no-op register/unregister.
const DEFAULT_VALUE: FormExtensionsContextValue = {
  formExtensions: {},
  registerFormExtension: noop,
  unregisterFormExtension: noop,
};

export const FormExtensionsContext = createContext<FormExtensionsContextValue>(DEFAULT_VALUE);

export const useFormExtensions = () => useContext(FormExtensionsContext);
