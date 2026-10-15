import {ReactNode} from 'react';
import {LayoutMenuItem} from '@design/layouts/types';

export type SchemaLayoutMenuItem = Omit<LayoutMenuItem, 'items'> & {
  key: string;
  priority: number;
  items?: SchemaLayoutMenuItem[];
};

export type ExtraMenuItem = {
  key: string;
  title?: string;
  priority?: number;
  items?: ExtraMenuItem[];
  icon?: ReactNode;
  href?: string;
};
