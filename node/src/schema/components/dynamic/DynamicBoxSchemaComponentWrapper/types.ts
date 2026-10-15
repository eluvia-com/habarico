import {FC} from 'react';
import {SchemaBoxProps} from '@schema/components/boxes/types';

export type DynamicBoxSchemaComponentWrapperProps = {
  component: FC<SchemaBoxProps>;
} & SchemaBoxProps;
