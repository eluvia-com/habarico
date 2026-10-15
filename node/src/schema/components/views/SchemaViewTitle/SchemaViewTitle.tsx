import React from 'react';
import {useRecordContext} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {HabRecord} from '@schema/types';

// Absorbs the former `DetailSchemaViewTitle` (HAB-668): a labelled view uses its schema label, and a
// dialog-presented view falls back to the record's `repr`. The fallback is inert without a record, so
// list/create views (which carry no single record) render nothing extra.
export const SchemaViewTitle = () => {
  const {presentation} = useViewPresentation();
  const isInOverlay = presentation !== 'page';
  const record = useRecordContext<HabRecord>();
  const {viewSchema} = useViewSchemaContext();

  if (viewSchema.label) return <DynamicText>{viewSchema.label}</DynamicText>;
  if (isInOverlay && record) return <DynamicText>{record.meta.repr}</DynamicText>;
  return null;
};
