import React from 'react';
import {
  RecordRepresentation,
  RecordRepresentationChipProps,
  RecordRepresentationLinkProps,
} from '@admin/components/fields/RecordRepresentation';
import {
  SchemaRecordLinkOptions,
  UseSchemaRecordLinkOptionsProps,
  useSchemaRecordLinkOptions,
} from '@schema/hooks/useSchemaRecordLinkOptions';

// Each member of the admin union, minus the link options a schema supplies and plus the
// schema-level `link` / `linkMode` they are derived from. `Omit` is applied per member rather than
// to the union, which would collapse it to the keys the two have in common and lose the
// discriminant with them.
export type SchemaRecordRepresentationChipProps = Omit<
  RecordRepresentationChipProps,
  keyof SchemaRecordLinkOptions
> &
  UseSchemaRecordLinkOptionsProps;

export type SchemaRecordRepresentationLinkProps = Omit<
  RecordRepresentationLinkProps,
  keyof SchemaRecordLinkOptions
> &
  UseSchemaRecordLinkOptionsProps;

/**
 * Props of `SchemaRecordRepresentation`, discriminated by `variant` exactly as the admin
 * component's are, so the chip's look stays off the `'link'` variant. A caller that only ever
 * renders one of the two — a project component colouring a chip by record status, say — types
 * itself with that member instead of the union.
 */
export type SchemaRecordRepresentationProps =
  SchemaRecordRepresentationChipProps | SchemaRecordRepresentationLinkProps;

/**
 * `RecordRepresentation` with its link described the way the schema describes it: `link` says
 * *whether* to link (and optionally to which view), `linkMode` which surface to open it on, and the
 * resource's schema decides whether that view exists, what fills an overlay and what the requested
 * surface resolves to in the container the representation sits in. Every other prop — `variant`,
 * `dialogWidth`, `keepLinkedParent`, `maxWidth` and the chip's own `size` / `chipVariant` /
 * `color` / `icon` — is the admin component's and reaches it untouched.
 */
export const SchemaRecordRepresentation = ({
  link = false,
  linkMode,
  ...rest
}: SchemaRecordRepresentationProps) => (
  <RecordRepresentation {...rest} {...useSchemaRecordLinkOptions({link, linkMode})} />
);
