export type FormInputSourcesRegistrationType = {
  register: (source: string) => void;
  unregister: (source: string) => void;
};

export type FormInputSourcesContextType = {
  sources: string[];
};
