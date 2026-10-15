// @ts-nocheck
import {cloneDeep, get, isEqual, mergeWith, set} from 'lodash-es';
import React, {useEffect, useMemo} from 'react';
import {
  FilterLiveFormProps,
  FormGroupsProvider,
  SourceContextProvider,
  SourceContextValue,
  getFilterFormValues,
  getSimpleValidationResolver,
  useDebouncedEvent,
  useListContext,
  useResourceContext,
} from 'react-admin';
import {FormProvider, useForm} from 'react-hook-form';
import {Box} from '@mui/material';

type FilterLiveDivProps = Omit<FilterLiveFormProps, 'formComponent'> & {
  formComponent?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>;
};

// Lodash merge customizer to merge objects but not arrays
const mergeCustomizer = (objValue: any, srcValue: any) => {
  if (Array.isArray(srcValue)) {
    return srcValue;
  }
};

const mergeObjNotArray = (a: any, b: any) => mergeWith(cloneDeep(a), b, mergeCustomizer);

export const FilterLiveDiv = (props: FilterLiveDivProps) => {
  const {filterValues, setFilters} = useListContext();
  const resource = useResourceContext(props);

  const {
    debounce = 500,
    resolver,
    validate,
    children,
    formComponent: Component = Box,
    ...rest
  } = props;

  const validationResolver = validate ? getSimpleValidationResolver(validate) : undefined;
  const finalResolver = resolver ?? validationResolver;

  const formContext = useForm({
    mode: 'onChange',
    resolver: finalResolver,
    ...rest,
  });
  const {handleSubmit, getValues, reset, watch, formState} = formContext;
  const {isValid} = formState;

  // Reapply filterValues when they change externally
  useEffect(() => {
    const newValues = getFilterFormValues(getValues(), filterValues);
    const previousValues = getValues();
    if (!isEqual(newValues, previousValues)) {
      reset(newValues);
    }
    // The reference to the filterValues object is not updated when it changes,
    // so we must stringify it to compare it by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filterValues), getValues, reset]);

  const onSubmit = (values: any): void => {
    // Do not call setFilters if the form is invalid
    if (!isValid) {
      return;
    }
    setFilters(mergeObjNotArray(filterValues, values));
  };
  const debouncedOnSubmit = useDebouncedEvent(onSubmit, debounce || 0);

  // Submit the form on values change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const {unsubscribe} = watch((values, {name}) => {
      // Check that the name is present to avoid setting filters when
      // watch was triggered by a reset
      if (name) {
        if (get(values, name) === '') {
          const newValues = cloneDeep(values);
          set(newValues, name, '');
          debouncedOnSubmit(newValues);
        } else {
          debouncedOnSubmit(values);
        }
      }
    });
    return () => unsubscribe();
  }, [watch, debouncedOnSubmit]);

  const sourceContext = useMemo<SourceContextValue>(
    () => ({
      getSource: (source: string) => source,
      getLabel: (source: string) => `resources.${resource}.fields.${source}`,
    }),
    [resource]
  );

  return (
    <FormProvider {...formContext}>
      <FormGroupsProvider>
        <SourceContextProvider value={sourceContext}>
          <Component onSubmit={handleSubmit(onSubmit)}>{children}</Component>
        </SourceContextProvider>
      </FormGroupsProvider>
    </FormProvider>
  );
};
