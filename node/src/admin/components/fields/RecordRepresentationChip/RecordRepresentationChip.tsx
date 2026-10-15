import React from 'react';
import {RecordRepresentation, useTranslate} from 'react-admin';
import {TOOLTIP_ENTER_DELAY} from '@admin/constants';
import {UseRecordLinkProps, useRecordLink} from '@admin/hooks/useRecordLink';
import {EllipsisWithTitle} from '@design/atoms/EllipsisWithTitle';
import {Icon, IconType} from '@design/atoms/Icon';
import {Chip, Tooltip} from '@mui/material';

export type RecordRepresentationChipProps = {
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined' | 'soft';
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  maxWidth?: number | string;
  icon?: React.ReactElement | false;
} & UseRecordLinkProps;

/**
 * The ambient record rendered as a chip, optionally linking to its own show / edit view.
 *
 * Schema-agnostic: the link is described by an already-resolved `viewType`, because deciding
 * whether a resource *has* a show or an edit view needs a schema. The `UseRecordLinkProps` half of
 * the props is handed straight to `useRecordLink`, so a caller opting into an overlay
 * (`linkMode="dialog"` / `"panel"`) supplies the `renderContent` that fills it — the hook throws
 * without one. `@schema`'s `SchemaRecordRepresentationChip` wraps this and derives all of it from
 * the schema.
 */
export const RecordRepresentationChip = ({
  size = 'small',
  variant = 'soft',
  color = 'primary',
  // `100%` (not a fixed px default) so the cap always tracks whatever width the caller's own
  // container actually has at the current viewport — a fixed number either over-truncates on a
  // wide panel or, on a narrow one (a stacked `PropertyItem` value cell on a phone), is too
  // generous to constrain anything at all. Resolved here (not left to `EllipsisWithTitle`'s own
  // default) so the `Chip` below can be capped at the exact same value — see its `sx`.
  maxWidth = '100%',
  icon = <Icon icon={IconType.OpenInNew} fontSize="inherit" />,
  ...recordLinkProps
}: RecordRepresentationChipProps) => {
  const translate = useTranslate();
  const {handleClick, dialog} = useRecordLink(recordLinkProps);

  const chip = (
    <Chip
      icon={icon || undefined}
      onClick={handleClick}
      variant={variant}
      size={size}
      color={color}
      label={<RecordRepresentation />}
      // Cap the chip itself, not just its `EllipsisWithTitle` wrapper: MUI's `.MuiChip-label`
      // already truncates its own text with an ellipsis, so bounding the chip's own width lets
      // that kick in and keeps its rounded shape and padding intact. Left to the wrapper's
      // `overflow: hidden` alone, the chip renders at its natural (unbounded) width and gets
      // hard-clipped flush at the wrapper's edge instead — mid-shape, with no ellipsis.
      sx={{maxWidth}}
    />
  );

  return (
    <>
      <EllipsisWithTitle maxWidth={maxWidth}>
        {handleClick ? (
          <Tooltip
            title={translate(
              recordLinkProps.viewType === 'edit'
                ? 'ra.action.edit_record'
                : 'ra.action.show_record'
            )}
            enterDelay={TOOLTIP_ENTER_DELAY}
          >
            {chip}
          </Tooltip>
        ) : (
          chip
        )}
      </EllipsisWithTitle>
      {dialog}
    </>
  );
};
