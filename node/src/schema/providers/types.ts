import {ReactElement} from 'react';
import {DataProvider, Identifier, SortPayload, Validator} from 'react-admin';
import {ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {FieldProps} from '@admin/components/fields/types';
import {InputProps} from '@admin/components/inputs/types';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {
  ActionSchema,
  BoxSchema,
  FieldFormatType,
  FieldSchema,
  FieldType,
  FiltersConfiguration,
  GlobalViewSchema,
  LocalResourceSchema,
  RequestMethodType,
  ServiceSchema,
  ValidatorRule,
  ViewType,
} from '@schema/types';
import {ActionParams} from '@typing';

export type ResourceFieldProviderProps = {
  source: string;
  type: FieldType;
  isInList?: boolean;
  format?: FieldFormatType;
  schema?: FieldSchema;
  locale?: string;
  props: FieldProps;
};

export type ResourceInputProviderProps = {
  source: string;
  type: FieldType;
  format?: FieldFormatType;
  schema?: FieldSchema;
  locale?: string;
  isFilter?: boolean;
  props: InputProps;
};

export type ResourceBoxProviderProps = {
  schema: BoxSchema;
  excludeFields?: string[];
  props: SchemaBoxProps;
};

export type ResourceButtonProviderProps = {
  schema: ActionSchema;
  viewSchema?: GlobalViewSchema;
  recordPk?: Identifier;
  reference?: string;
  target?: string;
  props: ActionButtonProps;
};

export type ResourceViewProviderProps = {
  name?: string;
  actionName?: string;
  router?: boolean;
  type: ViewType | 'subresource';
};

export type ResourceFieldProvider = (
  props: ResourceFieldProviderProps
) => ReactElement<FieldProps> | undefined | null;

export type ResourceInputProvider = (
  props: ResourceInputProviderProps
) => ReactElement | undefined | null;

export type ResourceBoxProvider = (
  props: ResourceBoxProviderProps
) => ReactElement<SchemaBoxProps> | undefined | null;

export type ResourceButtonProvider = (
  props: ResourceButtonProviderProps
) => ReactElement | undefined | null;

export type ExportParams = {
  format: string;
  fields?: string[];
  ids?: Identifier[];
  filter?: FiltersConfiguration;
  sort?: SortPayload;
};

// `blob` is missing for 202 responses (async export accepted, no file yet);
// `filename` is missing when the response has no readable Content-Disposition
export type ExportResult = {
  status: number;
  blob?: Blob;
  filename?: string;
};

export type ServiceDataProvider = DataProvider & {
  callAction: (
    resource: string,
    method: RequestMethodType,
    path?: string,
    params?: ActionParams
  ) => Promise<{data: unknown}>;
  export: (resource: string, params: ExportParams) => Promise<ExportResult>;
};

export type AdminFieldProviderProps = ResourceFieldProviderProps & {
  resource?: string;
};

export type AdminInputProviderProps = ResourceInputProviderProps & {
  resource?: string;
};

export type AdminBoxProviderProps = ResourceBoxProviderProps & {
  resource?: string;
};

export type AdminButtonProviderProps = ResourceButtonProviderProps & {
  resource?: string;
};

export type AdminViewProviderProps = ResourceViewProviderProps & {
  resource?: string;
};

export type AdminFieldProvider = (
  props: AdminFieldProviderProps
) => ReactElement<FieldProps> | undefined | null;

export type AdminInputProvider = (
  props: AdminInputProviderProps
) => ReactElement | undefined | null;

export type AdminBoxProvider = (
  props: AdminBoxProviderProps
) => ReactElement<SchemaBoxProps> | undefined | null;

export type AdminButtonProvider = (
  props: AdminButtonProviderProps
) => ReactElement | undefined | null;

export type AdminViewProvider = (props: AdminViewProviderProps) => ReactElement | undefined | null;

export type ResourceValidatorProviderProps = {
  rule: ValidatorRule;
  source: string;
};

export type AdminValidatorProviderProps = ResourceValidatorProviderProps & {
  resource?: string;
};

/**
 * Maps a single schema `ValidatorRule` to a react-admin `Validator`. Mirrors the other
 * customization providers: a consumer-supplied `validatorProvider` is consulted first (to add a
 * validator for a new rule `type` or override a built-in one) and `defaultValidatorProvider` is
 * the fallback. Return a `Validator` to handle the rule, `undefined` to defer to the default, or
 * `null` to suppress the rule entirely (no validator, and skip the default).
 */
export type AdminValidatorProvider = (
  props: AdminValidatorProviderProps
) => Validator | undefined | null;

type ServiceSchemaParams = {
  meta?: {locale?: string};
};

type RecordSchemaParams = {
  params?: {[key: string]: string | number | boolean};
  meta?: {locale?: string};
};

export type SchemaProvider = {
  getServiceSchema: (
    serviceName: string,
    serviceUrl: string,
    params?: ServiceSchemaParams
  ) => Promise<ServiceSchema>;
  getRecordSchema: (
    resourceUrl: string,
    actionName?: string,
    recordId?: Identifier,
    params?: RecordSchemaParams
  ) => Promise<LocalResourceSchema>;
  listPreferences?: (serviceUrl: string) => Promise<Record<string, unknown>>;
  setPreference?: (serviceUrl: string, key: string, value: unknown) => Promise<void>;
  deletePreference?: (serviceUrl: string, key: string) => Promise<void>;
  deleteAllPreferences?: (serviceUrl: string) => Promise<void>;
};
