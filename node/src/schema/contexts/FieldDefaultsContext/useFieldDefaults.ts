import {createContext, useContext} from 'react';
import {FieldDefaults} from '@schema/types';

/**
 * The shapes a field falls back to when neither its own prop nor the application says otherwise.
 * Every key is resolved, so a consumer reads `.boolean` rather than repeating `?? 'chip'`.
 */
export const FIELD_DEFAULTS: Required<FieldDefaults> = {
  reference: 'chip',
  boolean: 'chip',
  choices: 'chip',
};

export const FieldDefaultsContext = createContext<Required<FieldDefaults>>(FIELD_DEFAULTS);

/**
 * The resolved field shapes for the subtree: `SchemaResource`'s `fieldDefaults` merged over
 * `SchemaAdmin`'s, over the built-in defaults.
 *
 * Unlike `useListConfigContext`, this one does **not** throw outside a provider — it returns
 * {@link FIELD_DEFAULTS}. A field is rendered in a unit test and in a Storybook story with no
 * admin above it, and a hook that throws there would make the provider mandatory for every one of
 * them to say nothing new.
 */
export const useFieldDefaults = () => useContext(FieldDefaultsContext);
