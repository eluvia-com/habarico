---
title: Providers
sidebar_position: 1
---

Providers are the seams of the library. Three of them connect it to a backend — authentication,
data and schemas — four are registries through which you replace generated UI with your own
components, either globally or for a single resource, and one maps the backend's validation rules
to the validators that enforce them.

| Page | What it covers |
| --- | --- |
| [Auth provider](./auth-provider.md) | Login, logout, identity, MFA and password flows |
| [Data provider](./data-provider.md) | CRUD calls, actions, search and aggregations |
| [Schema provider](./schema-provider.md) | Fetching service, record and aggregate schemas |
| [Field provider](./field-provider.md) | Replacing a display component |
| [Input provider](./input-provider.md) | Replacing a form input |
| [Button provider](./button-provider.md) | Replacing an action button |
| [Box provider](./box-provider.md) | Replacing a layout container |
| [Validator provider](./validator-provider.md) | Mapping a schema validation rule to a validator |

## How an override is resolved

The four registries all work the same way. Habarico asks, in order:

1. the resource's provider, passed to [SchemaResource](../base-components/schema-resource.md),
2. the admin-wide provider, passed to [SchemaAdmin](../base-components/schema-admin.md),
3. the built-in `default*Provider`.

A provider returns one of three things:

| Returned | Meaning |
|---|---|
| an element | Render it — the search ends here |
| `undefined` | “Not mine” — hand the decision to the next step |
| `null` | Render **nothing** — the search ends here too |

so an override only has to name the cases it actually cares about.

:::caution
`null` is not the same as `undefined`. Returning `null` suppresses the field, input, box or button
altogether; only `undefined` falls through to the next provider. An implicit `return` in a
provider yields `undefined`, which is what you want — an explicit `return null` hides the element.
:::

:::tip
Match on the narrowest thing that identifies your case — usually `source` plus `resource`, or a
`format` you introduced on the backend. Matching on `type` alone replaces the component for every
field of that type in the whole admin.
:::

One further registry follows the same pattern but lives in `habarico-enterprise`, with the feature
it serves: the widget catalogue behind
[dashboard widget types](../dashboard/adding-a-new-widget-type.md).

The [validator provider](./validator-provider.md) answers the same three ways but resolves in two
steps, not three: it has no per-resource variant, so a rule it declines falls straight through to
`defaultValidatorProvider`. It also returns a validator function rather than an element.

## See also

- [SchemaAdmin](../base-components/schema-admin.md) — where the admin-wide providers are passed
- [SchemaResource](../base-components/schema-resource.md) — where the per-resource ones are
