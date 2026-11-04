import React from 'react';
import {RecordRepresentation as RaRecordRepresentation} from 'react-admin';
import {UseRecordLinkProps, useRecordLink} from '@admin/hooks/useRecordLink';
import {EllipsisWithTitle} from '@design/atoms/EllipsisWithTitle';
import {
  RecordRepresentationChipContent,
  RecordRepresentationChipStyleProps,
} from './RecordRepresentationChipContent';
import {RecordRepresentationLinkContent} from './RecordRepresentationLinkContent';

/** The shape a record's representation takes: a chip (a tag) or a plain text link. */
export type RecordRepresentationVariant = 'chip' | 'link';

type RecordRepresentationBaseProps = {
  maxWidth?: number | string;
} & UseRecordLinkProps;

export type RecordRepresentationChipProps = RecordRepresentationBaseProps &
  RecordRepresentationChipStyleProps & {
    variant?: 'chip';
  };

export type RecordRepresentationLinkProps = RecordRepresentationBaseProps & {
  variant: 'link';
};

/**
 * Props of `RecordRepresentation`, discriminated by `variant`: the chip's own look (`size`,
 * `chipVariant`, `color`, `icon`) belongs to the `'chip'` branch alone, so passing one alongside
 * `variant="link"` is a type error rather than a prop that silently does nothing.
 */
export type RecordRepresentationProps =
  RecordRepresentationChipProps | RecordRepresentationLinkProps;

/**
 * The ambient record rendered as its representation, optionally linking to its own show / edit
 * view. `variant` picks the shape: a `'chip'` (the default — a tag, with an icon and a tooltip
 * naming the view it opens) or a `'link'` (plain text, for a reference that should read as part of
 * the surrounding text). Both resolve the link, cap their width and host their overlay the same
 * way; only the body differs.
 *
 * Not to be confused with `@schema`'s `SchemaRecordLink`, which makes *arbitrary children*
 * clickable; this one renders the record's own representation and caps its width.
 *
 * Schema-agnostic: the link is described by an already-resolved `viewType`, because deciding
 * whether a resource *has* a show or an edit view needs a schema. The `UseRecordLinkProps` half of
 * the props is handed straight to `useRecordLink`, so a caller opting into an overlay
 * (`linkMode="dialog"` / `"panel"`) supplies the `renderContent` that fills it — the hook throws
 * without one. `@schema`'s `SchemaRecordRepresentation` wraps this and derives all of it from the
 * schema.
 */
export const RecordRepresentation = (props: RecordRepresentationProps) => {
  // `100%` (not a fixed px default) so the cap always tracks whatever width the caller's own
  // container actually has at the current viewport — a fixed number either over-truncates on a
  // wide panel or, on a narrow one (a stacked `PropertyItem` value cell on a phone), is too
  // generous to constrain anything at all. Resolved here (not left to `EllipsisWithTitle`, whose
  // own default is 200px and would truncate a detail-view representation the caller never meant to
  // cap) so the chip body can be capped at the exact same value — see its `sx`.
  const {maxWidth = '100%'} = props;
  // Resolved once, for either body: both are presentational and take the link already made.
  const {handleClick, dialog} = useRecordLink(props);

  return (
    <>
      <EllipsisWithTitle maxWidth={maxWidth}>
        {props.variant === 'link' ? (
          <RecordRepresentationLinkContent handleClick={handleClick}>
            <RaRecordRepresentation />
          </RecordRepresentationLinkContent>
        ) : (
          <RecordRepresentationChipContent {...props} maxWidth={maxWidth} handleClick={handleClick}>
            <RaRecordRepresentation />
          </RecordRepresentationChipContent>
        )}
      </EllipsisWithTitle>
      {dialog}
    </>
  );
};
