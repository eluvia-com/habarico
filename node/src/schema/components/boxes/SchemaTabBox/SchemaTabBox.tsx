import React from 'react';
import {DynamicBoxSchemaComponentWrapper} from '@schema/components/dynamic/DynamicBoxSchemaComponentWrapper';
import {SchemaTabBoxContent} from './SchemaTabBoxContent';
import {SchemaTabBoxProps} from './types';

export const SchemaTabBox = (props: SchemaTabBoxProps) => {
  return <DynamicBoxSchemaComponentWrapper component={SchemaTabBoxContent} {...props} />;
};
