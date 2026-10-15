import React from 'react';
import {InputHelperText, useInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {InputLayout} from '@design/molecules/InputLayout';
import {TreeChoice, TreeItemId, TreeSelect} from '@design/molecules/TreeSelect';

export type TreeArrayInputProps = InputProps & {
  choices: TreeChoice[];
};

/**
 * Multi-select input for hierarchical `tree-relation` references. A thin binding over the design
 * `TreeSelect`: it owns only the React Admin form wiring (`useInput` — value is the array of checked
 * node ids) and delegates the label / frame / validation-error chrome to `InputLayout` (the same
 * outlined-fieldset frame `UploadInput` uses, since `TreeSelect` has no MUI outline of its own). The
 * `choices` are supplied by the caller — the schema layer feeds them via `useTreeChoices`, keeping
 * this input schema-agnostic and free of any React Admin choices/reference context.
 */
export const TreeArrayInput = ({
  source,
  label,
  choices,
  validate,
  defaultValue,
  helperText,
  fullWidth,
  disabled,
}: TreeArrayInputProps) => {
  const {
    field: {onChange, value},
    fieldState: {error, invalid},
  } = useInput({source, validate, defaultValue});

  return (
    <InputLayout
      label={label}
      error={invalid}
      disabled={disabled}
      fullWidth={fullWidth}
      // Only render the helper row when there's an error or an explicit helperText — otherwise RA's
      // `InputHelperText` emits a zero-width space that would keep an empty `MuiFormHelperText-root`
      // reserving vertical space, offsetting this input from the others (which drop the empty row).
      helperText={
        invalid || (helperText != null && helperText !== false) ? (
          <InputHelperText error={error?.message} helperText={helperText} />
        ) : undefined
      }
    >
      <TreeSelect
        choices={choices}
        // React Admin seeds an unset field with `''` (not `undefined`), so coerce to an array.
        selectedIds={Array.isArray(value) ? (value as TreeItemId[]) : []}
        onSelectionChange={onChange}
        disabled={disabled}
        expand="all"
      />
    </InputLayout>
  );
};
