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
