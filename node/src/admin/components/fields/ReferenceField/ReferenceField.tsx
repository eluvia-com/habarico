import React from 'react';
import {
  ReferenceField as RaReferenceField,
  ReferenceFieldProps as RaReferenceFieldProps,
  useLocaleState,
} from 'react-admin';
import {RecordRepresentation} from '@admin/components/fields/RecordRepresentation';
import {recordLinkSx} from '@admin/components/fields/recordLinkSx';
import {UseRecordLinkProps} from '@admin/hooks/useRecordLink';

// React Admin's own `link` is fixed to `false` below, so it is dropped from the props rather than
// accepted and ignored: linking is the child representation's job, described by `recordLinkProps`.
export type ReferenceFieldProps = Omit<RaReferenceFieldProps, 'link'> & {
  recordLinkProps?: UseRecordLinkProps;
};

/**
 * Resolves a reference and renders the referenced record, by default as a chip
 * (`RecordRepresentation`). Adds the current locale to the query so the referenced record comes
 * back translated, and resets React Admin's link styling.
 *
 * Schema-agnostic: `recordLinkProps` is handed to the default representation as-is, so linking is
 * described by an already-resolved `viewType`. `@schema`'s `SchemaRecordRepresentation`, passed as
 * `children`, derives that from the schema instead — it has to be a child, because the resource and
 * record contexts it reads are the *referenced* ones and only exist inside this component.
 */
export const ReferenceField = ({
  children,
  source,
  queryOptions,
  recordLinkProps,
  sx,
  // Dropped rather than forwarded: React Admin's `ReferenceFieldView` spreads everything it does not
  // consume onto its root `<span>`, and `label` is not on that list — so the label meant for the
  // enclosing layout would land on the DOM node (React warns outright for the `label={false}` a box
  // that renders the label itself passes down). The prop stays part of the API: a layout reads it
  // off this element, not off the span this renders.
  label: _label,
  ...rest
}: ReferenceFieldProps) => {
  const [locale] = useLocaleState();

  return (
    <RaReferenceField
      link={false}
      source={source}
      {...rest}
      // Merged with the caller's own `sx` rather than placed before `{...rest}`, where the spread
      // would drop it: MUI resolves an array of `sx` values in order, so a caller styles on top of
      // the link reset instead of silently replacing it. Dropping it would leave React Admin's
      // anchor styling in place and make a linked field read as a link rather than as its content.
      sx={[recordLinkSx, ...(Array.isArray(sx) ? sx : [sx ?? false])]}
      queryOptions={{...queryOptions, meta: {locale, ...queryOptions?.meta}}}
    >
      {children || <RecordRepresentation {...recordLinkProps} />}
    </RaReferenceField>
  );
};
