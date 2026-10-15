import {Validator, maxLength, maxValue, minLength, minValue} from 'react-admin';
import {AdminValidatorProviderProps} from '@schema/providers/types';

/**
 * Longest value a schema `regex` rule is checked against in the browser. Matching backtracks
 * super-linearly on a long input for patterns as ordinary as `^a*a*$`, and the rule is validated
 * by the backend anyway, so anything above this is left to it — the same fallback as for a rule
 * the frontend cannot enforce.
 */
const MAX_VALIDATED_LENGTH = 1000;

/**
 * Built-in mapping from a schema `ValidatorRule` (`options.validators`, defined by the backend)
 * to a react-admin `Validator`. This is the default validator provider; a consumer can pass a
 * `validatorProvider` to `SchemaAdmin` to add validators for new rule types or override these,
 * falling back here for any rule it does not handle.
 *
 * Empty values are ignored by all of the produced validators — presence is enforced separately
 * via `required()`. Returns `undefined` for an unknown rule type or a non-JavaScript-compatible
 * regex pattern, leaving enforcement of that rule to the backend.
 */
export const defaultValidatorProvider = ({
  rule,
  source,
}: AdminValidatorProviderProps): Validator | undefined => {
  switch (rule.type) {
    case 'max_length':
      return maxLength(rule.value as number, rule.message);
    case 'min_length':
      return minLength(rule.value as number, rule.message);
    case 'max_value':
      return maxValue(rule.value as number, rule.message);
    case 'min_value':
      return minValue(rule.value as number, rule.message);
    case 'regex': {
      let pattern: RegExp;
      try {
        pattern = new RegExp(rule.value as string);
      } catch {
        // The backend sent a pattern that is not JavaScript-compatible — skip the rule
        // and leave its enforcement to the backend.
        console.warn(`Invalid regex pattern in schema for field "${source}": ${rule.value}`);
        return undefined;
      }
      // Without a message of its own, the rule reports a generic format error.
      const message = rule.message ?? 'ra.validation.invalid_format';
      return (value) =>
        typeof value !== 'string' ||
        value === '' ||
        value.length > MAX_VALIDATED_LENGTH ||
        pattern.test(value)
          ? undefined
          : {message, args: {}};
    }
    default:
      return undefined;
  }
};
