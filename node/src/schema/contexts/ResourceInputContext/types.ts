import {ReactElement} from 'react';
import {ResourceInputProviderProps} from '@schema/providers/types';

export type ResourceInputProviderState = (
  props: ResourceInputProviderProps
) => ReactElement | undefined | null;
