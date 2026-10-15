import {ReactElement} from 'react';

export type DynamicRequiredProps = {
  requiredQuery?: string;
  children: ReactElement<{isRequired?: boolean}>;
};

export type DynamicRequiredWrapperRenderProps = DynamicRequiredProps & {
  requiredQuery: string;
};
