import React, {MouseEvent, ReactNode} from 'react';
import {useTranslate} from 'react-admin';
import {TOOLTIP_ENTER_DELAY} from '@admin/constants';
import {RecordLinkViewType} from '@admin/hooks/useRecordLink';
import {Icon, IconType} from '@design/atoms/Icon';
import {Chip, Tooltip} from '@mui/material';

/**
 * The chip's own look. Declared here, beside the chip that reads it, and folded into
 * `RecordRepresentation`'s `variant: 'chip'` branch — which is what keeps these props off the
 * `'link'` variant, where none of them mean anything.
 */
export type RecordRepresentationChipStyleProps = {
  size?: 'small' | 'medium';
  // MUI's own chip variant, under a name of its own: this component spends `variant` on choosing
  // the representation itself (chip or text link).
  chipVariant?: 'filled' | 'outlined' | 'soft';
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon?: React.ReactElement | false;
};

type RecordRepresentationChipContentProps = RecordRepresentationChipStyleProps & {
  maxWidth: number | string;
  handleClick?: (event: MouseEvent) => void;
  // Only to name the view in the tooltip — the link itself is already resolved by the time it gets
  // here.
  viewType?: RecordLinkViewType;
  children: ReactNode;
};

/**
 * `RecordRepresentation`'s chip body: the representation as a tag, with an "open in new" glyph and
 * a tooltip naming the view it opens. Presentational — the link is handed to it already resolved,
 * and a missing `handleClick` is what makes the chip inert.
 */
export const RecordRepresentationChipContent = ({
  size = 'small',
  chipVariant = 'soft',
  color = 'primary',
  icon = <Icon icon={IconType.OpenInNew} fontSize="inherit" />,
  maxWidth,
  handleClick,
  viewType,
  children,
}: RecordRepresentationChipContentProps) => {
  const translate = useTranslate();

  const chip = (
    <Chip
      icon={icon || undefined}
      onClick={handleClick}
      variant={chipVariant}
      size={size}
      color={color}
      label={children}
      // Cap the chip itself, not just its `EllipsisWithTitle` wrapper: MUI's `.MuiChip-label`
      // already truncates its own text with an ellipsis, so bounding the chip's own width lets
      // that kick in and keeps its rounded shape and padding intact. Left to the wrapper's
      // `overflow: hidden` alone, the chip renders at its natural (unbounded) width and gets
      // hard-clipped flush at the wrapper's edge instead — mid-shape, with no ellipsis.
      sx={{maxWidth}}
    />
  );

  if (!handleClick) return chip;

  return (
    <Tooltip
      title={translate(viewType === 'edit' ? 'ra.action.edit_record' : 'ra.action.show_record')}
      enterDelay={TOOLTIP_ENTER_DELAY}
    >
      {chip}
    </Tooltip>
  );
};
