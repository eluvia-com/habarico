import React from 'react';
import type {ColorType} from '@design/theme/core';
import {Chip, Tooltip} from '@mui/material';
import {EllipsisWithTitle} from '../../atoms/EllipsisWithTitle';
import {useValueLocationContext} from '../../contexts/ValueLocationContext';

export type EnumChipProps = {
  /** Pre-resolved icon element (e.g. from `resolveEnumIcon`), or none. */
  icon?: React.ReactElement;
  label: string;
  color: ColorType | 'default';
  source: string;
};

// The single renderer for an enum value: a soft `Chip` (icon + label, tinted by `color`) that reads
// `ValueLocationContext` and collapses to an icon-only tooltipped glyph inside a collection. The icon
// arrives already resolved — callers own the name→element resolution (and any registry lookup).
export const EnumChip = ({icon, label, color, source}: EnumChipProps) => {
  const {isInCollection} = useValueLocationContext();
  const maxChipWidth = isInCollection
    ? `calc(var(--field-${source.replace(/\./g, '__')}, 500px) - 32px)`
    : undefined;

  if (isInCollection && icon) {
    // Collapse to an icon-only glyph, tinting/sizing it here since there is no chip to inherit from.
    const collapsedIcon = React.cloneElement(
      icon as React.ReactElement<{fontSize?: string; color?: string}>,
      {fontSize: 'small', color: color === 'default' ? undefined : color}
    );
    return <Tooltip title={label}>{collapsedIcon}</Tooltip>;
  }

  return (
    <EllipsisWithTitle maxWidth={maxChipWidth}>
      <Chip size="small" variant="soft" color={color} icon={icon} label={label} />
    </EllipsisWithTitle>
  );
};
