import React from 'react';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {FormDynamicRequiredWrapper} from './FormDynamicRequiredWrapper';
import {DynamicRequiredProps} from './types';

/**
 * Clones `isRequired` onto `children` while `requiredQuery` holds. Only meaningful in a form, so a
 * read-only view renders `children` untouched — and never mounts the form hook, which would throw
 * outside a `<Form>`.
 */
export const DynamicRequiredWrapper = ({requiredQuery, children}: DynamicRequiredProps) => {
  const {readOnly} = useViewSchemaContext();

  if (!requiredQuery || readOnly) {
    return children;
  }

  return (
    <FormDynamicRequiredWrapper requiredQuery={requiredQuery}>
      {children}
    </FormDynamicRequiredWrapper>
  );
};
