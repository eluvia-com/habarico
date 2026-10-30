import React from 'react';
import {ArrayField, SingleFieldList} from 'react-admin';
import {ChoicesFieldVariant} from '@admin/components/fields/ChoicesField';
import {FieldProps} from '@admin/components/fields/types';
import {Choices, choicesCarryColor} from '@admin/utils/choices';
import {ValueChip} from './ValueChip';

export type ChipArrayFieldProps = FieldProps & {
  /** Optional enum: when set, each value is resolved to its label/color/icon; otherwise shown raw. */
  choices?: Choices;
  /** App icon-registry key, passed through to the chip (replaces reading `options.choices.iconsKey`). */
  iconsKey?: string;
  /**
   * `'chip'` (the default) or `'text'`. Shares `ChoicesField`'s vocabulary and its rule: an enum
   * whose options define an explicit color keeps its chips, because the color is information plain
   * text cannot carry. Values with no enum behind them have no color and always honor `'text'`.
   */
  variant?: ChoicesFieldVariant;
};

// Renders an array of scalar values as a row of chips — `ArrayField` + `SingleFieldList` iterating a
// private `ValueChip`. With `choices` the chips resolve to their enum label/color/icon; without, they
// show the raw values. The presence of `choices` (not a `format` flag) drives the enum branch.
export const ChipArrayField = ({
  source,
  record,
  choices,
  iconsKey,
  variant = 'chip',
}: ChipArrayFieldProps) => {
  const asText = variant === 'text' && !choicesCarryColor(choices);

  return (
    <ArrayField source={source} record={record}>
      <SingleFieldList
        linkType={false}
        // One value per line in the text shape, for the same reason the reference array stacks its
        // links: a row of bare words reads as one run-on phrase, where chips carry a shape that
        // keeps neighbors apart. A datagrid row has no fixed height, so the cell simply grows.
        direction={asText ? 'column' : 'row'}
        sx={asText ? {alignItems: 'flex-start'} : undefined}
      >
        <ValueChip source={source} choices={choices} iconsKey={iconsKey} asText={asText} />
      </SingleFieldList>
    </ArrayField>
  );
};
