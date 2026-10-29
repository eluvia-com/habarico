import React, {forwardRef, useMemo} from 'react';
import {useTranslate} from 'react-admin';
import {BooleanField as RaBooleanField} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {Icon, IconType} from '@design/atoms/Icon';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {SvgIconComponent} from '@mui/icons-material';
import {Chip, Typography} from '@mui/material';

/** The MUI chip style the `'chip'` shape is drawn in. */
type ChipVariant = 'text' | 'filled' | 'outlined' | 'soft';

/**
 * The shape a boolean takes: a yes/no `'chip'` (the default), the plain `'text'` of the yes/no
 * translation, or an `'icon'` — a tick / cross glyph, used inside a collection where a column has
 * no width to spare for a word and falling back to `'text'` in a detail view. That fallback
 * mirrors `EnumChip`, which likewise collapses to a bare glyph only inside a collection.
 */
export type BooleanFieldVariant = 'chip' | 'text' | 'icon';

export type BooleanFieldProps = FieldProps & {
  /**
   * `true` colors the value green for true and red for false. It applies to the `'chip'` and
   * `'icon'` shapes; `'text'` stays in the surrounding text color, where a tinted word reads as a
   * link rather than as a status.
   */
  color?: boolean;
  variant?: BooleanFieldVariant;
  /** MUI chip style. Read by the `'chip'` shape alone. */
  chipVariant?: ChipVariant;
};

type ValueIconProps = {
  label: string;
  color: 'success' | 'error' | 'default';
  shape: BooleanFieldVariant;
  chipVariant: ChipVariant;
  glyph: IconType;
};

// All three shapes are handed to React Admin as its `TrueIcon` / `FalseIcon`, rather than rendered
// in place of its field: that is what keeps RA's own value handling: `null` / `undefined` falls
// back to `emptyText` before it ever reaches one of these, and the yes/no tooltip
// (`ra.boolean.true` / `.false`) comes with it — redundant beside a labelled chip or word, and the
// whole affordance of the bare glyph.
const makeValueIcon = ({label, color, shape, chipVariant, glyph}: ValueIconProps) => {
  const ValueIcon = forwardRef<HTMLDivElement>(() => {
    if (shape === 'icon') {
      return <Icon icon={glyph} fontSize="small" color={color === 'default' ? 'inherit' : color} />;
    }
    if (shape === 'text') {
      return (
        <Typography variant="body2" noWrap>
          {label}
        </Typography>
      );
    }
    return (
      <Chip sx={{lineHeight: 1.5}} size="small" variant={chipVariant} color={color} label={label} />
    );
  });
  ValueIcon.displayName = label;
  return ValueIcon as unknown as SvgIconComponent;
};

export const BooleanField = ({
  color,
  variant = 'chip',
  chipVariant = 'soft',
  ...rest
}: BooleanFieldProps) => {
  const translate = useTranslate();
  const {isInCollection} = useValueLocationContext();

  // `'icon'` is a collection affordance: a glyph buys back a column's width, but in a detail view a
  // tick beside a label is harder to read than the word it stands for, so it resolves to `'text'`
  // there. Every other shape is the same in both places.
  const shape = variant === 'icon' && !isInCollection ? 'text' : variant;

  const TrueIcon = useMemo(
    () =>
      makeValueIcon({
        label: translate('ra.message.yes'),
        color: color ? 'success' : 'default',
        shape,
        chipVariant,
        glyph: IconType.Check,
      }),
    [color, shape, chipVariant, translate]
  );

  const FalseIcon = useMemo(
    () =>
      makeValueIcon({
        label: translate('ra.message.no'),
        color: color ? 'error' : 'default',
        shape,
        chipVariant,
        glyph: IconType.Close,
      }),
    [color, shape, chipVariant, translate]
  );

  return <RaBooleanField {...rest} TrueIcon={TrueIcon} FalseIcon={FalseIcon} />;
};
