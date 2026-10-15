import React, {useEffect, useMemo} from 'react';
import {required, useWrappedSource} from 'react-admin';
import {useFormInputSourcesRegistration} from '@admin/contexts/FormInputSourcesContext/useFormInputSourcesContext';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {styled} from '@mui/material';
import {SchemaInputProps} from '@schema/components/inputs/types';
import {FieldSchemaProvider} from '@schema/contexts/FieldSchemaContext';
import {useGetInput} from '@schema/contexts/ResourceInputContext/useGetInput';
import {useSchemaValidators} from '@schema/hooks/useSchemaValidators';

const InputRoot = styled('div', {
  name: 'InputRoot',
  slot: 'Root',
})(() => ({
  // No vertical gutter: the input sits flush so it lines up with its label (the box's `PropertyItem`
  // owns the label) and stacks tightly inside an array iterator. Row spacing is owned by the layout.
  paddingBottom: '0px',
  paddingTop: '0px',
  minWidth: '50px',
}));

export const SchemaWriteonlyInputContent = (props: SchemaInputProps) => {
  const {
    schema,
    source = schema.name,
    label = schema.label,
    size = 'small',
    isRequired,
    disabled,
    onChange,
    helperText = schema.helpText,
    placeholder,
  } = props;

  const getInputEl = useGetInput();
  const getValidators = useSchemaValidators();
  const resource = useResourceContext();
  // Registration-only subscription: the callbacks are stable, so this never re-renders the input —
  // unlike `useFormInputSourcesContext`, whose `sources` list changes with every registration
  // anywhere in the form.
  const {register, unregister} = useFormInputSourcesRegistration();
  const wrappedSource = useWrappedSource(source);

  useEffect(() => {
    if (!register || !unregister) return;
    register(wrappedSource);
    return () => unregister(wrappedSource);
  }, [wrappedSource, register, unregister]);

  // Memoized: rebuilding this array per render re-created every validator closure — including a
  // `new RegExp` compile per `regex` rule in `defaultValidatorProvider` — and a fresh `validate`
  // identity makes react-admin's `useInput` re-compose and re-register its validator with
  // react-hook-form on every render of every input.
  const validate = useMemo(
    () => [...(schema.required || isRequired ? [required()] : []), ...getValidators(schema)],
    [schema, isRequired, getValidators]
  );

  const inputProps = {
    label: label,
    source,
    size,
    disabled,
    validate,
    helperText: helperText,
    fullWidth: true,
    onChange,
    placeholder,
  };

  const inputEl = getInputEl({
    resource,
    source,
    type: schema.type,
    format: schema.format,
    schema,
    props: inputProps,
  });
  if (!inputEl) return undefined;

  return (
    <FieldSchemaProvider schema={schema}>
      <InputRoot className="InputRoot">{inputEl}</InputRoot>
    </FieldSchemaProvider>
  );
};
