---
title: SchemaAction
sidebar_position: 6
---

Renders a form for a non-CRUD action — approve, publish, bulk process — and submits it to the
action endpoint.

An action that needs input from the user gets this view. An action that needs none is just a
[button](../providers/button-provider.md); it does not open a form at all.

## Example

```tsx
<SchemaAction
  actionName="publish"
  params={{channel: 'web'}}
  onPostSubmit={() => notify('Published')}
/>
```

## Props

On top of these it accepts React Admin's `CreateProps` except `children`.

| Name | Type | Default | Description |
|---|---|---|---|
| `actionName` | `string` | — | Action identifier from the resource schema |
| `name` | `string` | `'action'` | Name of the action view |
| `children` | `ReactNode` | generated form | Replaces the generated inputs |
| `onSubmit` | `SubmitHandler<FieldValues>` | default action call | Takes over submitting entirely |
| `onPostSubmit` | `() => void` | — | Runs after a successful submit |
| `params` | `Record<string, string>` | — | Extra parameters sent with the request |

:::caution
`SchemaAction` does not take `title`, `toolbarActions` or `formActions` as props. It reads them
from the action's view schema (`label`, `detail.toolbarActions`) and renders `SchemaFormActions`;
customise through `children`.
:::

## How the form is built

The action's own schema — fetched from `…/{id}/{action}/schema/` for a per-record action — carries
the fields to collect. That is why the same action can ask for different inputs on different
records, and why an action a user may not run simply does not appear in their schema.

A response carrying `meta.state: "running"` turns the action into a background task: the UI polls
for its result and notifies on each state change, see
[useCallAction](../hooks/use-call-action.md).

## See also

- [useCallAction](../hooks/use-call-action.md) — running an action without this view
- [Custom actions](/ruby/schema-and-field-customization/custom-actions) — declaring actions on the Ruby side
- [Action view schema generator](/python/view-generators/action-view-schema-generator) — the same on the Python side
- [View schema and action schema](../types-and-schemas/view-schema-and-action-schema.md) — the shapes involved
- [Actions and dialogs](/concepts/guides/actions-and-dialogs) — the three shapes an action can take
