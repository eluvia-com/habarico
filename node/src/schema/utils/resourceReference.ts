import {ResourceReference} from '@schema/types';

type ReferenceMapper = (reference: ResourceReference) => ResourceReference;

/** The `service/resource` key a reference stands for in React Admin and the data provider. */
export function resourceKey(reference: ResourceReference): string;
export function resourceKey(reference: ResourceReference | undefined): string | undefined;
export function resourceKey(reference: ResourceReference | undefined): string | undefined {
  return reference && `${reference.service}/${reference.resource}`;
}

/** The service half of a `service/resource` key. */
export const serviceOfKey = (key: string): string => key.split('/')[0];

/** The bare resource name of a `service/resource` key — the `{resource_name}` segment alone. */
export const resourceOfKey = (key: string): string => key.split('/')[1];

/**
 * A key telling apart references that load different schemas. `params` is a query, so the order its
 * keys happen to arrive in says nothing about the address — the entries are sorted, or two backends
 * (or two generators) emitting the same query in a different order would look like two addresses and
 * each be fetched on its own.
 */
export const referenceKey = (reference: ResourceReference): string => {
  const params = reference.params ?? {};
  return JSON.stringify([
    resourceKey(reference),
    reference.recordPk ?? null,
    reference.actionName ?? null,
    Object.keys(params)
      .sort()
      .map((key) => [key, params[key]]),
  ]);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Every reference in the contract lives under the key `reference`; `endpoint` always wraps one
// inside its own `reference`, with no exception.
const isReferenceAt = (key: string, value: unknown): value is ResourceReference =>
  key === 'reference' && isObject(value) && typeof value.resource === 'string';

// Free-form values of the contract, which hold user data and never a reference.
const FREE_FORM_KEYS = new Set(['defaultValue', 'data', 'params', 'parameters']);

const mapChild = (key: string, child: unknown, map: ReferenceMapper) => {
  if (FREE_FORM_KEYS.has(key)) return child;
  return isReferenceAt(key, child) ? map(child) : mapReferences(child, map);
};

// Copy-on-write: a branch is copied only where something changed, so an input needing no change
// comes back as the same object.
const mapReferences = <T>(value: T, map: ReferenceMapper): T => {
  if (Array.isArray(value)) {
    const items = value.map((item) => mapReferences(item, map));
    return (items.some((item, index) => item !== value[index]) ? items : value) as T;
  }
  if (!isObject(value)) return value;
  const entries = Object.entries(value).map(
    ([key, child]) => [key, mapChild(key, child, map)] as const
  );
  const changed = entries.some(([key, mapped]) => mapped !== value[key]);
  return (changed ? Object.fromEntries(entries) : value) as T;
};

/** Fills the service the backend left out of every reference in a schema or a record's `meta`. */
export const resolveReferences = <T>(value: T, service: string): T =>
  mapReferences(value, (reference) => (reference.service ? reference : {...reference, service}));

/** Whether some reference in a schema still lacks its service. */
export const hasUnresolvedReferences = (value: unknown): boolean => {
  let unresolved = false;
  mapReferences(value, (reference) => {
    if (!reference.service) unresolved = true;
    return reference;
  });
  return unresolved;
};
