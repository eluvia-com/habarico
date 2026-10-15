import {ReactElement} from 'react';
import {BoxSchema} from '@schema/types';

export type SchemaBoxProps = {
  schema: BoxSchema;
  label?: string | ReactElement | false;
  excludeFields?: string[];
  isRequired?: boolean;
  /**
   * Whether this is the view's first box (the one the view content renders directly). Only the
   * root box may take the card default on a page surface - see `useBoxCard`. Nested boxes never
   * receive it, so it is `false` below the root by construction.
   */
  isRoot?: boolean;
};
