import React from 'react';
import {SelectField} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useIcons} from '@admin/contexts/AdminConfigContext';
import {Choices, choicesCarryColor, resolveChoice} from '@admin/utils/choices';
import {EnumChip, resolveEnumIcon} from '@design/molecules/EnumChip';
import {ColorType} from '@design/theme/core/palette';
import {Typography} from '@mui/material';

/**
 * The shape a choice takes: an `EnumChip` (the default) or the plain `'text'` of its label.
 *
 * `'text'` is not unconditional, and this is the one place where it is worth knowing why: a chip of
 * a colored enum *carries* the color, and plain text cannot. So a field whose options define an
 * explicit color stays a chip even under `'text'` — see {@link choicesCarryColor}.
 */
export type ChoicesFieldVariant = 'chip' | 'text';

export type ChoicesFieldProps = FieldProps & {
  choices: Choices;
  /** App icon-registry key for per-option leading icons (schema maps `options.choices.iconsKey`). */
  iconsKey?: string;
  variant?: ChoicesFieldVariant;
};

export const ChoicesField = ({
  source,
  label,
  record,
  emptyText,
  choices,
  iconsKey,
  variant = 'chip',
}: ChoicesFieldProps) => {
  const {getIcon} = useIcons();
  const asText = variant === 'text' && !choicesCarryColor(choices);

  return (
    <SelectField
      record={record}
      label={label}
      source={source}
      choices={choices.map((choice) => ({id: choice.value, name: choice.label}))}
      optionText={(choice: {[key: string | number]: string}) => {
        if (asText) {
          return (
            <Typography variant="body2" noWrap>
              {choice.name}
            </Typography>
          );
        }

        const resolvedChoice = resolveChoice(choice.id, choices);
        const color: ColorType | 'default' =
          resolvedChoice?.color && resolvedChoice.color !== 'inherit'
            ? resolvedChoice.color
            : 'default';
        const icon =
          (resolvedChoice?.icon ? resolveEnumIcon(resolvedChoice.icon) : undefined) ||
          getIcon(source, choice.id, iconsKey) ||
          undefined;

        return <EnumChip label={choice.name} color={color} icon={icon} source={source} />;
      }}
      emptyText={emptyText}
    />
  );
};
