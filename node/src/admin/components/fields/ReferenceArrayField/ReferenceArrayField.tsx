import React from 'react';
import {
  ReferenceArrayField as RaReferenceArrayField,
  ReferenceArrayFieldProps as RaReferenceArrayFieldProps,
  SingleFieldList,
  useLocaleState,
} from 'react-admin';
import {RecordRepresentation} from '@admin/components/fields/RecordRepresentation';
import {recordLinkSx} from '@admin/components/fields/recordLinkSx';
import {UseRecordLinkProps} from '@admin/hooks/useRecordLink';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {OrderedListProvider} from './OrderedListProvider';

export type ReferenceArrayFieldProps = RaReferenceArrayFieldProps & {
  linkType?: 'edit' | 'show' | false;
  preserveOrder?: boolean;
  recordLinkProps?: UseRecordLinkProps;
};

/**
 * The array counterpart of `ReferenceField`: resolves a list of references and renders each as a
 * chip (`RecordRepresentation`). `preserveOrder` keeps the order stored on the record rather than
 * the order the data provider returned them in.
 *
 * Schema-agnostic, on the same terms as `ReferenceField` — see its note on why a schema-aware
 * representation has to arrive as `children`.
 */
export const ReferenceArrayField = ({
  source,
  children,
  linkType,
  preserveOrder,
  queryOptions,
  recordLinkProps,
  sx,
  ...rest
}: ReferenceArrayFieldProps) => {
  const {isInCollection} = useValueLocationContext();
  const [locale] = useLocaleState();
  const columnWidthVarName = source.replace(/\./g, '__');
  const maxChipWidth = isInCollection
    ? `calc(var(--field-${columnWidthVarName}, 500px) - 32px)`
    : undefined;

  const content = children || (
    <SingleFieldList linkType={linkType}>
      <RecordRepresentation maxWidth={maxChipWidth} {...recordLinkProps} />
    </SingleFieldList>
  );

  return (
    <RaReferenceArrayField
      source={source}
      {...rest}
      // Merged with the caller's own `sx` rather than placed before `{...rest}`, where the spread
      // would drop it: MUI resolves an array of `sx` values in order, so a caller styles on top of
      // the link reset instead of silently replacing it. Dropping it would leave React Admin's
      // anchor styling in place and make a linked field read as a link rather than as its content.
      sx={[recordLinkSx, ...(Array.isArray(sx) ? sx : [sx ?? false])]}
      queryOptions={{...queryOptions, meta: {locale, ...queryOptions?.meta}}}
    >
      {preserveOrder ? (
        <OrderedListProvider source={source}>{content}</OrderedListProvider>
      ) : (
        content
      )}
    </RaReferenceArrayField>
  );
};
