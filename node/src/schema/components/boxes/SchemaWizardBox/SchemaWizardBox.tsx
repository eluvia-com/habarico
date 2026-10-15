import React from 'react';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {DynamicBoxSchemaComponentWrapper} from '@schema/components/dynamic/DynamicBoxSchemaComponentWrapper';
import {SchemaWizardBoxContent} from './SchemaWizardBoxContent';

export const SchemaWizardBox = (props: SchemaBoxProps) => {
  return <DynamicBoxSchemaComponentWrapper component={SchemaWizardBoxContent} {...props} />;
};
