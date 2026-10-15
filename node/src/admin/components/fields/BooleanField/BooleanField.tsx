import React, {forwardRef, useMemo} from 'react';
import {useTranslate} from 'react-admin';
import {BooleanField as RaBooleanField} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {SvgIconComponent} from '@mui/icons-material';
import {Chip} from '@mui/material';

type chipVariant = 'text' | 'filled' | 'outlined' | 'soft';

export type BooleanFieldProps = FieldProps & {
  color?: boolean;
  chipVariant?: chipVariant;
};

const makeChipIcon = (
  label: string,
  color: 'success' | 'error' | 'default',
  variant: chipVariant
) => {
  const Icon = forwardRef<HTMLDivElement>(() => {
    return (
      <Chip sx={{lineHeight: 1.5}} size="small" variant={variant} color={color} label={label} />
    );
  });
  Icon.displayName = label;
  return Icon as unknown as SvgIconComponent;
};

export const BooleanField = ({color, chipVariant = 'soft', ...rest}: BooleanFieldProps) => {
  const translate = useTranslate();
  const TrueIcon = useMemo(
    () => makeChipIcon(translate('ra.message.yes'), color ? 'success' : 'default', chipVariant),
    [color, chipVariant, translate]
  );

  const FalseIcon = useMemo(
    () => makeChipIcon(translate('ra.message.no'), color ? 'error' : 'default', chipVariant),
    [color, chipVariant, translate]
  );

  return <RaBooleanField {...rest} TrueIcon={TrueIcon} FalseIcon={FalseIcon} />;
};
