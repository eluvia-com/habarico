import {ReactElement} from 'react';

export type DynamicRenderProps = {
  showQuery?: string;
  children: ReactElement;
  hiddenEl?: ReactElement;
};

export type DynamicWrapperRenderProps = {
  showQuery: string;
  children: ReactElement;
  hiddenEl?: ReactElement;
};
