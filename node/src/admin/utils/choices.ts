import {ColorType} from '@design/theme/core/palette';

// Admin-local, schema-free choice model. Structurally identical to the schema enum type
// (`{value, label, color?, icon?}[]`, with the same `ColorType` colors), so a schema wrapper can pass
// its enum straight through as `choices` without any conversion. Keeping the type here lets the admin
// fields (`ChipArrayField`, `ChoicesField`) resolve a stored value against its options without any
// schema-layer dependency.
export type Choice = {
  value: string | number;
  label: string;
  color?: ColorType | 'inherit';
  icon?: string;
};

export type Choices = Choice[];

/** Finds the choice whose `value` matches `value` (compared as strings, since record values are raw). */
export const resolveChoice = (value: string | number, choices?: Choices): Choice | undefined =>
  choices?.find((c) => String(c.value) === String(value));

/**
 * Whether an enum's options carry an explicit color, i.e. whether a chip rendering them is
 * load-bearing rather than decorative. It is what makes `ChoicesField`'s / `ChipArrayField`'s
 * `variant: 'text'` conditional: plain text cannot carry a color, so a colored enum keeps its
 * chips.
 *
 * Evaluated over the whole option list, never per value, so one field renders one way for every
 * record — a column mixing chips and bare words reads as a rendering bug. `'inherit'` is the
 * contract's way of saying "no color of its own" and does not count.
 */
export const choicesCarryColor = (choices?: Choices) =>
  !!choices?.some((choice) => choice.color && choice.color !== 'inherit');
