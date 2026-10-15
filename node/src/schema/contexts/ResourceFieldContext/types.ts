import {ReactElement} from 'react';
import {FieldProps} from '@admin/components/fields/types';
import {ResourceFieldProviderProps} from '@schema/providers/types';

export type ResourceFieldProviderState = (
  props: ResourceFieldProviderProps
) => ReactElement<FieldProps> | undefined | null;
