import {ReactElement} from 'react';
import {ResourceButtonProviderProps} from '@schema/providers/types';

export type ResourceButtonProviderState = (
  props: ResourceButtonProviderProps
) => ReactElement | undefined | null;
