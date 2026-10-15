import {get} from 'lodash-es';
import React from 'react';
import {FunctionField, RaRecord} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {
  ValueLocationContextProvider,
  useValueLocationContext,
} from '@design/contexts/ValueLocationContext';
import {Box, Stack} from '@mui/material';
import {FieldSchema} from '@schema/types';
import {SchemaField} from '../SchemaField';

export type SchemaRangeFieldProps = FieldProps & {
  fields: FieldSchema[];
};

export const SchemaRangeField = ({source, fields}: SchemaRangeFieldProps) => {
  const {isInCollection} = useValueLocationContext();
  const upperField = fields.find((f) => f.name === 'upper');
  const lowerField = fields.find((f) => f.name === 'lower');

  if (!upperField || !lowerField) {
    throw new Error("SchemaRangeField requires 'upper' and 'lower' fields in the fields prop");
  }

  const format = (record: RaRecord) => {
    const value = get(record, source);
    if (!value && isInCollection)
      return (
        <Box width={184} textAlign={'center'}>
          --
        </Box>
      );
    if (!value) return '--';
    return (
      <ValueLocationContextProvider value={{isNested: true}}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box width={isInCollection ? 80 : undefined}>
            <SchemaField
              emptyText={'-∞'}
              label={false}
              source={`${source}.lower`}
              schema={lowerField}
            />
          </Box>
          <Box>-</Box>
          <Box width={isInCollection ? 80 : undefined}>
            <SchemaField
              emptyText={'∞'}
              label={false}
              source={`${source}.upper`}
              schema={upperField}
            />
          </Box>
        </Stack>
      </ValueLocationContextProvider>
    );
  };

  return (
    <FunctionField
      source={source}
      render={(record: RaRecord) => format(record)}
      sx={{whiteSpace: 'nowrap'}}
    />
  );
};
