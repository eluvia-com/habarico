import {ReactElement, ReactNode} from 'react';
import {Identifier} from 'react-admin';
import {LayoutLanguage} from '@design/layouts/types';

export type {ColorType, FieldDescriptor, FilterDescriptor} from '@schema/types';

export type IconsValueMap = {
  [value: string | number]: ReactElement;
};

export type GetIconFn = (source: string, value: string | number) => ReactElement;

export type IconsMap = {
  [iconsKey: string]: IconsValueMap | GetIconFn;
};

export type ServiceConfig = {
  url: string;
  icon?: ReactNode;
  label?: string;
  syncPreferences?: boolean;
};

export type ServiceConfigMap = {
  [serviceName: string]: ServiceConfig;
};

/**
 * Per-request metadata handed to the data provider. React Admin types its own `meta` as `any` and
 * puts it into the query key, so anything placed here also scopes the cache entry.
 */
export type RequestMeta = {
  locale?: string;
  [key: string]: unknown;
};

export type ActionParams = {
  id?: Identifier;
  data?: Record<string, unknown>;
  meta?: RequestMeta;
};

export type SearchParams = {
  search_query?: string;
  meta?: RequestMeta;
};

export type AdminLanguage = LayoutLanguage & {
  messages?: object;
};

export type DataType = Record<string, any>;
export type DefaultValues = Record<string, unknown>;
