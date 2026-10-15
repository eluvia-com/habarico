---
title: Hooks
sidebar_position: 1
---

Hooks for reading schemas, running actions and driving UI state. Use them when you build a custom
component that has to behave like the generated ones — inside the generated views the same data is
already in context.

## Data and actions

| Hook                                                            | What it gives you                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [useGetLocalResourceSchema](./use-get-local-resource-schema.md) | A resource's full schema plus flags for the views, actions and endpoints it exposes                                                                     |
| `useSchemaProvider`                                             | The schema provider in context; a type argument adds an extension package's methods as optional — see [SchemaProvider](../providers/schema-provider.md) |
| [useGetAll](./use-get-all.md)                                   | Every record of a resource, paginated behind the scenes                                                                                                 |
| [useCallAction](./use-call-action.md)                           | Runs a backend action, including polling for background tasks                                                                                           |
| [useAggregate](./use-aggregate.md)                              | An aggregation over a resource, and the schema saying what may be aggregated — ships in `habarico-enterprise`                                           |
| [useUploadQueue](./use-upload-queue.md)                         | The upload queue behind `UploadInput` — base64 and chunked                                                                                              |
| [useSubmitForm](./use-submit-form.md)                           | Submit handling for a hand-built form: notifications, field errors, loading state                                                                       |
| [useRemoveArrayItem](./use-remove-array-item.md)                | Row removal for a hand-built array editor, without the deleted row's values leaking onto its neighbour                                                  |

## Schemas and context

| Hook                                              | What it gives you                                                                                                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Schema lookup hooks](./schema-lookup-hooks.md)   | `useGetGlobalResourceSchema`, `useGlobalResourceSchemaContext`, `useGetServiceSchemas`, `useLocalResourceSchemaRefresh`                                                           |
| [Context hooks](./context-hooks.md)               | `useSchemaRootContext`, `useAdminConfig`, `useIcons`, `useViewSchemaContext`, `useFieldSchemaContext`, `useRootRecordContext`, `useFormInputSourcesContext`, `useFormInputSourcesRegistration`, `useUnsavedChanges`, `useUnsavedChangesControl`, `useGetTargetValues` |
| [useSchemaValidators](./use-schema-validators.md) | The validators for a field's schema rules, for an input you wrote yourself                                                                                                        |

## UI state

| Hook                                               | What it gives you                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [useTabsLocation](./use-tabs-location.md)          | Active tab state kept in the URL hash                                                    |
| [useRowClick](./use-row-click.md)                  | Single- and double-click activation for datagrid rows                                    |
| [useRecordLink](./use-record-link.md)              | Opens a record as a page, a dialog or a docked panel — the link behind every record chip |
| [useExporter](./use-exporter.md)                   | Runs a backend export and downloads the returned file                                    |
| [useStrTemplate](./use-str-template.md)            | Interpolates `%{record.field}` templates from the current record or form                 |
| [Dashboard hooks](../dashboard/dashboard-hooks.md) | `useDashboardStore` and `useGetWidget`, both from `habarico-enterprise`                  |

## Thin wrappers

`useRouter` and `usePathname` wrap react-router with no Habarico behaviour of their own —
`useRouter` returns `{back, forward, refresh, push, replace}` and `usePathname` returns the current
path. Use them for consistency with the library's own components, or use react-router directly;
there is no difference.

## See also

- [Providers](../providers/index.md) — the objects these hooks read from
- [Types and schemas](../types-and-schemas/index.md) — the shapes they return
