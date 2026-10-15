---
title: SchemaResource
sidebar_position: 6
---

Declares one resource inside [SchemaAdmin](./schema-admin.md).

The component renders nothing itself — it is a descriptor. `SchemaAdmin` reads its props and
builds the routes, views and overrides for that resource from them.

## Example

```tsx
<SchemaAdmin {...providers} serviceConfigMap={SERVICES}>
  <SchemaResource name="eshop/product" />

  <SchemaResource
    name="eshop/order"
    fieldProvider={({source, props}) =>
      source === 'total' ? <TotalWithVatField {...props} /> : undefined
    }
    show={<SchemaShow><OrderShowContent /></SchemaShow>}
  />
</SchemaAdmin>
```

## Props

On top of these it accepts React Admin's `ResourceProps` — `name` is required and takes the
`"service/resource"` form.

| Name | Type | Default | Description |
|---|---|---|---|
| `name` (required) | `string` | — | Resource name, e.g. `"eshop/product"` |
| `fieldProvider` | `ResourceFieldProvider` | — | [Display overrides](../providers/field-provider.md) for this resource only |
| `inputProvider` | `ResourceInputProvider` | — | [Input overrides](../providers/input-provider.md) for this resource only |
| `buttonProvider` | `ResourceButtonProvider` | — | [Button overrides](../providers/button-provider.md) for this resource only |
| `boxProvider` | `ResourceBoxProvider` | — | [Layout overrides](../providers/box-provider.md) for this resource only |
| `list` | `ReactElement` | generated | Replaces the list view |
| `create` | `ReactElement` | generated | Replaces the create view |
| `edit` | `ReactElement` | generated | Replaces the edit view |
| `show` | `ReactElement` | generated | Replaces the show view |

The resource-level providers are consulted before the admin-wide ones — see
[how an override is resolved](../providers/index.md#how-an-override-is-resolved).

:::tip
A resource that only needs the generated screens takes a single line. Reach for `list` / `show` /
`create` / `edit` when a view needs content that no schema can express; for one field or one
button, the providers are the smaller change.
:::

:::caution
`SchemaResource` must be a direct child of `SchemaAdmin`. It returns an empty fragment, so
rendering it anywhere else silently produces nothing.
:::

## See also

- [SchemaAdmin](./schema-admin.md) — the component that reads these descriptors
- [View components](../view-components/index.md) — what `list` / `show` / `create` / `edit` take
- [Providers](../providers/index.md) — the override seams
