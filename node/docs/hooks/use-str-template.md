---
title: useStrTemplate
sidebar_position: 7
---

Resolves `%{…}` placeholders in a string against the current record or the form being edited.

Use it for labels, titles and breadcrumbs that have to name the record they belong to. Backend
schemas use the same syntax, so a label declared server-side lands here unchanged.

## Signature

```typescript
import {useStrTemplate} from 'habarico';

const title = useStrTemplate('Order %{record.number}');
```

## Parameters

| Name | Type | Default | Description |
|---|---|---|---|
| `text` | `string \| ReactElement \| false` | — | The template; anything that is not a string is returned unchanged |
| `options.upperFirst` | `boolean` | `true` | Capitalises the first letter of the result |
| `options.truncate` | `boolean` | `false` | Shortens the result with an ellipsis |

## Returns

The resolved string — or `text` itself when it was not a string, which is what makes it safe to
call on a `label` prop that may be a node or `false`.

## Placeholder paths

| Prefix | Reads from |
|---|---|
| `%{record.field}` | The record in context |
| `%{formData.field}` | The form currently being edited; the hook subscribes to exactly those fields |
| `%{data.field}` | The form when there is one, otherwise the record |

A placeholder that resolves to nothing renders as an empty string, so a partially filled form
never shows a raw `%{…}`.

## Example

```tsx
const title = useStrTemplate('Order %{record.number} for %{record.customer_name}');

return <Typography variant="h5">{title}</Typography>;
```

:::caution
The syntax is `%{path}` with a dot path — not `{{field}}`, and not a bare field name. A
placeholder with the wrong shape is left in the output verbatim.
:::

## See also

- [View schema and action schema](../types-and-schemas/view-schema-and-action-schema.md) — where backend-declared labels come from
- [Rich text syntax](../utilities/rich-text-syntax.mdx) — the other markup used inside labels
