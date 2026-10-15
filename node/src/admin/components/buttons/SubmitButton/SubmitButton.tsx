import React from 'react';
import {useFormContext} from 'react-hook-form';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';

export const SubmitButton = ({label = 'ra.action.submit', ...props}: ActionButtonProps) => {
  const {
    formState: {isSubmitting},
  } = useFormContext();

  return (
    <ActionButton
      type={'submit'}
      color={'primary'}
      label={label}
      {...props}
      loading={isSubmitting}
    />
  );
};
