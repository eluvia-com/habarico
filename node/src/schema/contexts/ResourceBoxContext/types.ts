import {ReactElement} from 'react';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {ResourceBoxProviderProps} from '@schema/providers/types';

export type ResourceBoxProviderState = (
  props: ResourceBoxProviderProps
) => ReactElement<SchemaBoxProps> | undefined | null;
