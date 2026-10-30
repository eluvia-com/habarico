import React, {forwardRef, useMemo} from 'react';
import {useTranslate} from 'react-admin';
import {BooleanField as RaBooleanField} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {SvgIconComponent} from '@mui/icons-material';
import {Chip} from '@mui/material';

type ChipVariant = 'text' | 'filled' | 'outlined' | 'soft';

export type BooleanFieldProps = FieldProps & {
  color?: boolean;
  variant?: ChipVariant;
};

const makeChipIcon = (
  label: string,
  color: 'success' | 'error' | 'default',
  variant: ChipVariant
) => {
  const Icon = forwardRef<HTMLDivElement>(() => {
    return (
      <Chip sx={{lineHeight: 1.5}} size="small" variant={variant} color={color} label={label} />
    );
  });
  Icon.displayName = label;
  return Icon as unknown as SvgIconComponent;
};

export const BooleanField = ({color, variant = 'soft', ...rest}: BooleanFieldProps) => {
  const translate = useTranslate();
  const TrueIcon = useMemo(
    () => makeChipIcon(translate('ra.message.yes'), color ? 'success' : 'default', variant),
    [color, variant, translate]
  );

  const FalseIcon = useMemo(
    () => makeChipIcon(translate('ra.message.no'), color ? 'error' : 'default', variant),
    [color, variant, translate]
  );

  return <RaBooleanField {...rest} TrueIcon={TrueIcon} FalseIcon={FalseIcon} />;
};
