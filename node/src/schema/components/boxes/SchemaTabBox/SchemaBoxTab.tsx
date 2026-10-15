import React from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {FormStatusLabel} from '@admin/components/common/FormStatusLabel';
import {Tab, TabProps} from '@mui/material';
import {useParentBoxContext} from '@schema/contexts/ParentBoxContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {BoxSchema} from '@schema/types';

export type SchemaBoxTabProps = {
  schema: BoxSchema;
} & TabProps;

export const SchemaBoxTab = ({schema, ...props}: SchemaBoxTabProps) => {
  const {readOnly} = useViewSchemaContext();
  const {getBoxName} = useParentBoxContext();

  return readOnly ? (
    <Tab {...props} label={<DynamicText>{schema.label}</DynamicText>} />
  ) : (
    <Tab
      {...props}
      label={
        <FormStatusLabel groupName={getBoxName(schema.name)}>
          <DynamicText>{schema.label}</DynamicText>
        </FormStatusLabel>
      }
    />
  );
};
