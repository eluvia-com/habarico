import React from 'react';
import {
  ReferenceArrayField as RaReferenceArrayField,
  ReferenceArrayFieldProps as RaReferenceArrayFieldProps,
  SingleFieldList,
  useLocaleState,
} from 'react-admin';
import {RecordRepresentationChip} from '@admin/components/fields/RecordRepresentationChip';
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
 * `RecordRepresentationChip`. `preserveOrder` keeps the order stored on the record rather than the
 * order the data provider returned them in.
 *
 * Schema-agnostic, on the same terms as `ReferenceField` — see its note on why a schema-aware chip
 * has to arrive as `children`.
 */
export const ReferenceArrayField = ({
  source,
  children,
  linkType,
  preserveOrder,
  queryOptions,
  recordLinkProps,
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
      <RecordRepresentationChip maxWidth={maxChipWidth} {...recordLinkProps} />
    </SingleFieldList>
  );

  return (
    <RaReferenceArrayField
      source={source}
      sx={recordLinkSx}
      {...rest}
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
