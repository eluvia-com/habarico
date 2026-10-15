import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';

/**
 * Whether any configured service exposes global fulltext search. Drives whether the
 * search slot (toggle + overlay) is offered at all — see `SchemaLayout`. Kept in sync
 * with the guard inside `SchemaSearch`.
 */
export function useHasGlobalSearch(): boolean {
  const {serviceConfigMap, servicesSchema} = useSchemaRootContext();

  return Object.keys(serviceConfigMap).some(
    (key) =>
      servicesSchema &&
      servicesSchema[key] &&
      servicesSchema[key].some((schema) => schema.globalFulltextSearchEnabled)
  );
}
