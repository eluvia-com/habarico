import React from 'react';
import {Identifier, useGetOne, useGetRecordRepresentation, useLocaleState} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {EllipsisWithTitle, MaxWidthObject} from '@design/atoms/EllipsisWithTitle';

export type ResourceRepresentationProps = {
  id?: Identifier;
  resource?: string;
  maxWidth?: number | string | MaxWidthObject;
};

export const ResourceRepresentation = ({
  id,
  resource: inResource,
  maxWidth,
}: ResourceRepresentationProps) => {
  const resource = useResourceContext(inResource);
  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const [locale] = useLocaleState();
  const {data} = useGetOne(resource, {id, meta: {locale}});
  const recordRepresentation = getRecordRepresentation(data);

  if (!recordRepresentation) {
    return;
  }

  return (
    <EllipsisWithTitle maxWidth={maxWidth}>
      <DynamicText>{recordRepresentation}</DynamicText>
    </EllipsisWithTitle>
  );
};
