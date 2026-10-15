import React from 'react';
import {useInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {Box, FormHelperText, Stack} from '@mui/material';
import {SchemaInput} from '@schema/components/inputs/SchemaInput';
import {FieldSchema} from '@schema/types';
import {sx} from './sx';

export type SchemaRangeInputProps = InputProps & {
  defaultValue?: unknown;
  fields: FieldSchema[];
};

export const SchemaRangeInput = ({source, label, fields, helperText}: SchemaRangeInputProps) => {
  const upperField = fields.find((f) => f.name === 'upper');
  const lowerField = fields.find((f) => f.name === 'lower');

  const {
    fieldState: {error, invalid},
  } = useInput({
    source: source,
  });

  if (!upperField || !lowerField) {
    throw new Error("RangeField requires 'upper' and 'lower' fields in the fields prop");
  }

  const helper = (invalid && error?.message) || helperText || undefined;

  return (
    <Box width={'100%'}>
      <Stack direction="row" component="fieldset" sx={sx}>
        <Box component="legend" className="SchemaRangeInput-legend">
          {label}
        </Box>
        <Box className="SchemaRangeInput-lower">
          <SchemaInput
            defaultValue={''}
            source={`${source}.lower`}
            schema={lowerField}
            label={false}
            helperText={false}
            fullWidth
          />
        </Box>
        <Box className="SchemaRangeInput-separator">-</Box>
        <Box className="SchemaRangeInput-upper">
          <SchemaInput
            defaultValue={''}
            source={`${source}.upper`}
            schema={upperField}
            label={false}
            helperText={false}
            fullWidth
          />
        </Box>
      </Stack>
      {helper && <FormHelperText error={invalid}>{helper}</FormHelperText>}
    </Box>
  );
};
