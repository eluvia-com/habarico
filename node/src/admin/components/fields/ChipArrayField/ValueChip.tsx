import React from 'react';
import {RaRecord, useRecordContext} from 'react-admin';
import {useIcons} from '@admin/contexts/AdminConfigContext';
import {Choices, resolveChoice} from '@admin/utils/choices';
import {EnumChip, resolveEnumIcon} from '@design/molecules/EnumChip';

export type ValueChipProps = {
  source: string;
  choices?: Choices;
  iconsKey?: string;
  record?: RaRecord;
};

// Private adapter for `ChipArrayField`: reads one scalar value from the ambient record (as iterated by
// `SingleFieldList`), resolves it against the `choices`, and renders the single design `EnumChip`. The
// `record.toString()` binding is specific to `SingleFieldList`'s scalar iteration, so this stays local
// to the field rather than becoming a shared `admin/common` primitive.
export const ValueChip = (props: ValueChipProps) => {
  const {source, choices, iconsKey} = props;
  const record = useRecordContext(props);
  const {getIcon} = useIcons();

  const raw = record ? record.toString() : '';
  const choice = resolveChoice(raw, choices);
  const label = choice?.label ?? raw;
  const color = choice?.color && choice.color !== 'inherit' ? choice.color : 'default';
  const icon =
    (choice?.icon ? resolveEnumIcon(choice.icon) : undefined) || // schema enum icon name
    getIcon(source, raw, iconsKey) || // registry override
    undefined;

  return <EnumChip label={label} color={color} icon={icon} source={source} />;
};
