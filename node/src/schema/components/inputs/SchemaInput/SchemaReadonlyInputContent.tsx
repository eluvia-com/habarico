import React from 'react';
import {Labeled, useRecordContext} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {styled} from '@mui/material';
import {SchemaInputProps} from '@schema/components/inputs/types';
import {FieldSchemaProvider} from '@schema/contexts/FieldSchemaContext';
import {useGetField} from '@schema/contexts/ResourceFieldContext/useGetField';

const FieldRoot = styled('div')(({theme}) => ({
  display: 'flex',
  // MUI/react-admin field renderers commonly render their content as inline text (a Typography
  // wrapping a Chip, an icon, …), positioned by text-baseline rules rather than true vertical
  // centering — visibly off-center against a sibling in a flex row (e.g. a checkbox column in
  // `FormTable`) even though this box's own padding is symmetric. Flex-centering the content here
  // sidesteps that: the flex item is centered by its actual rendered box, baseline quirks and all.
  alignItems: 'center',
  paddingBottom: '8px',
  paddingTop: '8px',
  minWidth: '50px',

  '& del': {
    color: theme.palette.error.main,
  },

  '& ins': {
    color: theme.palette.success.main,
  },
}));

export const SchemaReadonlyInputContent = (props: SchemaInputProps) => {
  const {schema, showLabel, source = schema.name, label = schema.label} = props;
  const {isInCollection} = useValueLocationContext();
  const getFieldEl = useGetField();
  const record = useRecordContext(props);
  const resource = useResourceContext();

  const fieldProps: FieldProps = {
    source,
    label: label,
    emptyText: '--',
  };
  const fieldEl = getFieldEl({
    resource,
    source,
    type: schema.type,
    isInList: isInCollection,
    format: schema.format,
    schema,
    props: fieldProps,
  });
  if (!fieldEl || !record) return;

  let readonlyFieldEl = fieldEl;
  if (showLabel && fieldEl.props.showLabel) {
    readonlyFieldEl = (
      <Labeled label={fieldEl.props.label} fullWidth>
        {fieldEl}
      </Labeled>
    );
  }
  return (
    <FieldRoot>
      <FieldSchemaProvider schema={schema}>{readonlyFieldEl}</FieldSchemaProvider>
    </FieldRoot>
  );
};
