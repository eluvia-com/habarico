/**
 * Resolves a feature slot to its config object. Slots with all-optional config may be
 * enabled with `true` (shorthand for "enable with defaults"); this normalises `true`
 * to an empty config so consumers can uniformly read the object. Returns `undefined`
 * when the slot is absent.
 */
export const resolveSlot = <T extends object>(slot: T | true | undefined): T | undefined =>
  slot === true ? ({} as T) : slot;
