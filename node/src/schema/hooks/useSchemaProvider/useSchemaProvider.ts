import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {SchemaProvider} from '@schema/providers/types';

/**
 * The schema provider the application wired, typed for the package reading it.
 *
 * The built-in methods are always there. A type argument adds the methods a package contributes
 * through `schemaProviderFactory` — and adds them as **optional**, because an application may have
 * wired the built-in `getSchemaProvider` instead. That is the honest shape: a missing method means
 * the feature behind it is unavailable, not that something is broken, so the caller tests for it
 * and degrades rather than throwing.
 *
 * ```ts
 * // in habarico-enterprise
 * const {getAggregateSchema} = useSchemaProvider<EnterpriseSchemaProvider>();
 * if (!getAggregateSchema) return {schema: undefined, isUnsupported: true};
 * ```
 *
 * The assertion lives here, once, rather than in every package that extends the provider. It
 * asserts the provider *is* `TSchemaProvider`; the return type is what weakens the contributed
 * methods to optional, so a caller cannot reach one without checking for it first.
 */
export const useSchemaProvider = <
  TSchemaProvider extends SchemaProvider = SchemaProvider,
>(): SchemaProvider & Partial<TSchemaProvider> =>
  useSchemaRootContext().schemaProvider as TSchemaProvider;
