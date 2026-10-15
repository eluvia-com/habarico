import React from 'react';
import {SelectInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {useIcons} from '@admin/contexts/AdminConfigContext';
import {Choices} from '@admin/utils/choices';
import {Box} from '@mui/material';

export type ChoicesInputProps = InputProps & {
  choices: Choices;
  /** App icon-registry key for per-option leading icons (schema maps `options.choices.iconsKey`). */
  iconsKey?: string;
};

export const ChoicesInput = ({
  source,
  label,
  choices,
  iconsKey,
  validate,
  ...rest
}: ChoicesInputProps) => {
  const {getIcon} = useIcons();

  return (
    <SelectInput
      label={label}
      source={source}
      validate={validate}
      choices={choices.map((choice) => ({id: choice.value, name: choice.label}))}
      optionText={(option: {[key: string | number]: string}) => {
        return (
          <Box sx={{display: 'flex', alignItems: 'center'}} key={option.id}>
            {getIcon(source, option.id, iconsKey)} {option.name}
          </Box>
        );
      }}
      sx={{margin: 0}}
      {...rest}
    />
  );
};
