import React, {useState} from 'react';
import {SelectArrayInput} from 'react-admin';
import {useFormContext} from 'react-hook-form';
import {InputProps} from '@admin/components/inputs/types';
import {useIcons} from '@admin/contexts/AdminConfigContext';
import {Choices} from '@admin/utils/choices';
import {ColorType} from '@design/theme/core/palette';
import {Box, Chip} from '@mui/material';

export type ChoicesArrayInputProps = InputProps & {
  choices: Choices;
  defaultValue?: unknown;
  /** App icon-registry key for per-option leading icons (schema maps `options.choices.iconsKey`). */
  iconsKey?: string;
};

/**
 * Multi-value choices input — wraps React Admin's `SelectArrayInput` and owns all the presentation:
 * the enum→choices mapping, per-option leading icons (`useIcons`), the dropdown sizing `sx`, and the
 * selected-value rendering as coloured `soft` chips. Schema-agnostic; the schema layer
 * (`SchemaArrayInput`) feeds it `choices` / `iconsKey` and keeps the schema-driven dispatch.
 */
export const ChoicesArrayInput = ({
  source,
  label,
  choices,
  iconsKey,
  validate,
  defaultValue,
  size = 'small',
  ...rest
}: ChoicesArrayInputProps) => {
  const {getIcon} = useIcons();
  const {getValues, setValue} = useFormContext();
  const [open, setOpen] = useState(false);
  const choicesById = new Map(choices.map((choice) => [choice.value, choice]));

  const handleDelete = (id: string | number) => {
    const current = (getValues(source) as (string | number)[]) ?? [];
    setValue(
      source,
      current.filter((value) => value !== id),
      {shouldDirty: true, shouldTouch: true, shouldValidate: true}
    );
  };

  return (
    <SelectArrayInput
      choices={choices.map((choice) => ({id: choice.value, name: choice.label}))}
      optionText={(choice) => (
        <Box sx={{display: 'flex', alignItems: 'center'}}>
          {getIcon(source, choice.id, iconsKey)} {choice.name}
        </Box>
      )}
      source={source}
      label={label}
      validate={validate}
      defaultValue={defaultValue}
      size={size}
      sx={{
        '& .MuiInputLabel-root.MuiInputLabel-outlined:not(.MuiInputLabel-shrink)': {
          transform: 'translate(14px, 8px) scale(1)',
        },
        ...(!label && {
          '& .MuiOutlinedInput-notchedOutline legend > span': {
            paddingLeft: 0,
            paddingRight: 0,
          },
        }),
      }}
      options={{
        multiple: true,
        open,
        onOpen: () => setOpen(true),
        onClose: () => setOpen(false),
        MenuProps: {
          MenuListProps: {
            onClick: () => setOpen(false),
          },
        },
        renderValue: (selectedIds: unknown) => (
          <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, paddingTop: '2px'}}>
            {(selectedIds as (string | number)[]).map((id) => {
              const choice = choicesById.get(id);
              let color: ColorType | 'default' = 'default';
              if (choice?.color && choice.color !== 'inherit') {
                color = choice.color;
              }
              return (
                <Chip
                  key={id}
                  variant={'soft'}
                  size={size}
                  icon={getIcon(source, id, iconsKey)}
                  label={choice?.label || id}
                  color={color}
                  onMouseDown={(event) => event.stopPropagation()}
                  onDelete={() => handleDelete(id)}
                />
              );
            })}
          </Box>
        ),
      }}
      {...rest}
    />
  );
};
