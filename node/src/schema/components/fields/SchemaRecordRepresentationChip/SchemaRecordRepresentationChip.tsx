import React from 'react';
import {
  RecordRepresentationChip,
  RecordRepresentationChipProps,
} from '@admin/components/fields/RecordRepresentationChip';
import {
  SchemaRecordLinkOptions,
  UseSchemaRecordLinkOptionsProps,
  useSchemaRecordLinkOptions,
} from '@schema/hooks/useSchemaRecordLinkOptions';

export type SchemaRecordRepresentationChipProps = Omit<
  RecordRepresentationChipProps,
  keyof SchemaRecordLinkOptions
> &
  UseSchemaRecordLinkOptionsProps;

/**
 * `RecordRepresentationChip` with its link described the way the schema describes it: `link` says
 * *whether* to link (and optionally to which view), `linkMode` which surface to open it on, and the
 * resource's schema decides whether that view exists, what fills an overlay and what the requested
 * surface resolves to in the container the chip sits in. Every other prop — `dialogWidth`,
 * `keepLinkedParent`, and the chip's own size / variant / colour / icon — is the admin chip's and
 * reaches it untouched.
 */
export const SchemaRecordRepresentationChip = ({
  link = false,
  linkMode,
  ...rest
}: SchemaRecordRepresentationChipProps) => (
  <RecordRepresentationChip {...rest} {...useSchemaRecordLinkOptions({link, linkMode})} />
);
