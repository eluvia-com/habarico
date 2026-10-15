import React from 'react';
import {useInput, useTranslate} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {FormControl, FormLabel, Stack, ToggleButton, ToggleButtonGroup} from '@mui/material';

export type TriStateBooleanInputProps = InputProps;

export const TriStateBooleanInput = ({sx, ...props}: TriStateBooleanInputProps) => {
  const translate = useTranslate();

  const {field} = useInput({
    ...props,
    format: (v: boolean | undefined) => {
      if (v === true) return 'true';
      if (v === false) return 'false';
      return 'any';
    },
  });

  // Convert toggle string back to stored filter value.
  // 'true'/'false' => boolean; 'any' => '' (empty string, clears the filter).
  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue === null) return;
    if (newValue === 'true') field.onChange(true);
    else if (newValue === 'false') field.onChange(false);
    else field.onChange('');
  };

  return (
    <FormControl size="small" sx={sx}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ToggleButtonGroup
          value={field.value}
          exclusive
          onChange={handleChange}
          size="small"
          sx={{height: 40}}
        >
          <ToggleButton value="any" sx={{px: 1, minWidth: 48}}>
            {'–'}
          </ToggleButton>
          <ToggleButton value="true" sx={{px: 1, minWidth: 48}}>
            {translate('ra.filter.yes', {_: 'Yes'})}
          </ToggleButton>
          <ToggleButton value="false" sx={{px: 1, minWidth: 48}}>
            {translate('ra.filter.no', {_: 'No'})}
          </ToggleButton>
        </ToggleButtonGroup>
        {props.label !== false && <FormLabel sx={{fontSize: '0.75rem'}}>{props.label}</FormLabel>}
      </Stack>
    </FormControl>
  );
};
