import React from 'react';
import {ArrayField, SingleFieldList} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {Choices} from '@admin/utils/choices';
import {ValueChip} from './ValueChip';

export type ChipArrayFieldProps = FieldProps & {
  /** Optional enum: when set, each value is resolved to its label/color/icon; otherwise shown raw. */
  choices?: Choices;
  /** App icon-registry key, passed through to the chip (replaces reading `options.choices.iconsKey`). */
  iconsKey?: string;
};

// Renders an array of scalar values as a row of chips — `ArrayField` + `SingleFieldList` iterating a
// private `ValueChip`. With `choices` the chips resolve to their enum label/color/icon; without, they
// show the raw values. The presence of `choices` (not a `format` flag) drives the enum branch.
export const ChipArrayField = ({source, record, choices, iconsKey}: ChipArrayFieldProps) => (
  <ArrayField source={source} record={record}>
    <SingleFieldList linkType={false}>
      <ValueChip source={source} choices={choices} iconsKey={iconsKey} />
    </SingleFieldList>
  </ArrayField>
);
