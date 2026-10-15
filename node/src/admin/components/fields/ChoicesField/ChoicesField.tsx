import React from 'react';
import {SelectField} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useIcons} from '@admin/contexts/AdminConfigContext';
import {Choices, resolveChoice} from '@admin/utils/choices';
import {EnumChip, resolveEnumIcon} from '@design/molecules/EnumChip';
import {ColorType} from '@design/theme/core/palette';

export type ChoicesFieldProps = FieldProps & {
  choices: Choices;
  /** App icon-registry key for per-option leading icons (schema maps `options.choices.iconsKey`). */
  iconsKey?: string;
};

export const ChoicesField = ({
  source,
  label,
  record,
  emptyText,
  choices,
  iconsKey,
}: ChoicesFieldProps) => {
  const {getIcon} = useIcons();

  return (
    <SelectField
      record={record}
      label={label}
      source={source}
      choices={choices.map((choice) => ({id: choice.value, name: choice.label}))}
      optionText={(choice: {[key: string | number]: string}) => {
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
