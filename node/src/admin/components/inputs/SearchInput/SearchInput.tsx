import React from 'react';
import {FieldTitle, useInput, useTranslate} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {SearchField, SearchFieldProps} from '@design/atoms/SearchField';

// Presentational `SearchField` props a caller may still tune; the value-binding / labelling props
// are owned by this input (bound to React Admin form state) so they are excluded here.
type SearchFieldPassthrough = Omit<
  SearchFieldProps,
  | 'label'
  | 'helperText'
  | 'size'
  | 'sx'
  | 'placeholder'
  | 'fullWidth'
  | 'defaultValue'
  | 'value'
  | 'onChange'
  | 'onBlur'
  | 'name'
  | 'error'
  | 'id'
  | 'inputRef'
  | 'hiddenLabel'
>;

export type SearchInputProps = InputProps & SearchFieldPassthrough;

/**
 * A React Admin input that renders the design-layer `SearchField` (the mid-grey, icon-tiled search
 * box) instead of React Admin's stock text field, while binding to the form exactly like RA's own
 * `SearchInput` (via `useInput`) — so it works as a regular filter/form input (`source`, `alwaysOn`,
 * validation, reset). The admin-layer counterpart of `ra-ui`'s `SearchInput`: RA knowledge (the
 * `useInput` binding) lives here, the styling stays in the RA-agnostic design layer.
 *
 * The label is hidden by default (search boxes are labelled by their placeholder, which defaults to
 * the translated "Search"); pass a `label` to render one via `FieldTitle`. `alwaysOn` is read off
 * this element by RA's `FilterForm`, so it is accepted here but not consumed internally.
 */
export const SearchInput = ({
  source,
  label = false,
  helperText,
  validate,
  defaultValue,
  size = 'small',
  fullWidth = true,
  placeholder,
  sx,
  // Consumed by RA's `FilterForm` off this element (which filters render); not needed inside.
  alwaysOn: _alwaysOn,
  // Not a `SearchField` prop; accepted for API parity with the other inputs and ignored here.
  isRequired: _isRequired,
  ...rest
}: SearchInputProps) => {
  const translate = useTranslate();
  const {
    field,
    fieldState: {error, invalid},
    id,
    isRequired,
  } = useInput({source, validate, defaultValue});

  return (
    <SearchField
      {...rest}
      id={id}
      name={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      inputRef={field.ref}
      size={size}
      fullWidth={fullWidth}
      sx={sx}
      placeholder={placeholder ?? translate('ra.action.search', {_: 'Search'})}
      hiddenLabel={label === false}
      label={
        label === false ? undefined : (
          <FieldTitle label={label} source={source} isRequired={isRequired} />
        )
      }
      error={invalid}
      // `undefined` (not a blank string) so the helper row only appears on error — dynamic height,
      // consistent with the other inputs.
      helperText={invalid ? error?.message : helperText || undefined}
    />
  );
};
