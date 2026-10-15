import {Validator} from 'react-admin';
import {AdminValidatorProvider} from '@schema/providers/types';
import {FieldSchema} from '@schema/types';

/**
 * Maps a field schema's validation rules (`options.validators`) to react-admin validators,
 * resolving each rule through the provider chain: the consumer-supplied `provider` is consulted
 * first (to add a validator for a new rule `type` or override a built-in one), then
 * `defaultProvider` is used as the fallback. A provider may return `null` to suppress a rule
 * (skipping the default) or `undefined` to defer to the default.
 *
 * Pure and React-free so it can be unit-tested directly; the React-aware entry point that wires
 * the providers from context is the `useSchemaValidators` hook.
 */
export const buildSchemaValidators = (
  schema: FieldSchema,
  defaultProvider: AdminValidatorProvider,
  provider?: AdminValidatorProvider,
  resource?: string
): Validator[] => {
  const rules = schema.options?.validators;
  if (!rules) return [];

  return rules
    .map((rule) => {
      const props = {rule, source: schema.name, resource};
      if (provider) {
        const resolved = provider(props);
        // null → the provider explicitly suppresses this rule; do not fall back to the default.
        if (resolved === null) return undefined;
        if (resolved) return resolved;
      }
      return defaultProvider(props);
    })
    .filter((validator): validator is Validator => validator != null);
};
