---
title: Button provider
sidebar_position: 12
---

Replaces the button rendered for an action declared in the schema.

Use it when an action needs UI the generated button cannot express — an extra confirmation step, a
dialog collecting parameters, a different icon per record state.

## Signature

```typescript
type AdminButtonProvider = (props: {
  resource?: string;
  schema: ActionSchema;
  viewSchema?: GlobalViewSchema;
  recordPk?: Identifier;
  reference?: string;
  target?: string;
  props: ActionButtonProps;
}) => ReactElement | undefined | null;
```

The resource-level provider receives the same object without `resource`.

## Parameters

| Name | Type | Description |
|---|---|---|
| `resource` | `string` | Resource the action belongs to; admin-wide provider only |
| `schema` | `ActionSchema` | The action; `schema.type` is what the default provider switches on |
| `viewSchema` | `GlobalViewSchema` | The view a `view`-type action opens |
| `recordPk` | `Identifier` | Primary key of the record the action applies to |
| `reference` | `string` | Target resource when the action points at another one |
| `target` | `string` | FK field linking back to the parent record — set when the button sits inside a related list, not an HTML link target |
| `props` | `ActionButtonProps` | `icon`, `label`, `color`, `confirm`, `showLabel` and `surface` — spread them into your button. `icon` is set only when the action schema declares one |

## Returns

The element to render, `undefined` to let the next provider decide, or `null` to render nothing at
all. See
[how an override is resolved](./index.md#how-an-override-is-resolved).

## Action types

`defaultButtonProvider` handles these values of `schema.type`:

| `type` | Button |
|---|---|
| `view` | Opens a view — as a page, a dialog or a side panel, per `schema.view.mode` |
| `resource` | Calls an endpoint on the record, optionally as a background task |
| `link` | Navigates to an external URL |
| `save` | Submits the current form, optionally with extra data |
| `ai-assistant` | Generates field values through the AI endpoint |
| `upload-images` | Opens the bulk image upload dialog |
| `export` | Runs the backend export of the selected rows or the filtered list, in the action schema's `format` |

## Example

```tsx
<SchemaAdmin
  buttonProvider={({schema, recordPk, props}) => {
    if (schema.resource?.endpoint?.actionName === 'publish') {
      return <PublishButton recordId={recordPk} {...props} />;
    }
  }}
>
  <SchemaResource name="eshop/product" />
</SchemaAdmin>
```

`schema` is an `ActionSchema`, so it carries no action name of its own — identify the action by
the endpoint it points at (`schema.resource?.endpoint?.actionName`) or by the view it opens
(`schema.view?.name`).

:::caution
The `props` you receive already carry `confirm: {title, content}` when the schema declares a
confirmation dialog. A custom button that drops it silently removes the confirmation the backend
asked for.
:::

:::tip
`props.icon` is `undefined` when the backend sends no `icon` for the action — the default icon
belongs to the button, not to the provider. Give yours the same treatment:
`icon={props.icon ?? <PublishIcon />}`, so a backend-supplied icon still wins.
:::

## See also

- [View schema and action schema](../types-and-schemas/view-schema-and-action-schema.md) — how actions are declared
- [useCallAction](../hooks/use-call-action.md) — running the action from your own button
- [SchemaButtons](../navigation-components/schema-buttons-component.md) — where these buttons are rendered
- [Actions and dialogs](/concepts/guides/actions-and-dialogs) — when an action needs its own button
