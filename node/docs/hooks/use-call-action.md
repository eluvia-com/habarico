---
title: useCallAction
sidebar_position: 5
---

Calls a backend action and tracks its state, including background tasks it has to poll for.

Use it when you build your own action button. The generated action buttons already use it, so
overriding a button through the [ButtonProvider](../providers/button-provider.md) usually means
calling this hook the same way.

## Signature

```typescript
import {useCallAction} from '@eluvia/habarico';

const {callAction, isLoading, isRunning, isStarted, isError} = useCallAction({
  resource: 'eshop/product',
  method: 'post',
  path: '/publish/',
  isBackground: false,
});

await callAction({id: 42, data: {note: 'Ready'}});
```

## Parameters

| Name | Type | Default | Description |
|---|---|---|---|
| `resource` (required) | `string` | — | Resource in `"service/resource"` form |
| `method` (required) | `RequestMethodType` | — | HTTP method of the action endpoint (`get` \| `post` \| `put` \| `patch` \| `delete`) |
| `path` | `string` | — | Action path relative to the resource |
| `data` | `ActionParams` | — | Default payload; `callAction` may override it |
| `isBackground` | `boolean` | `false` | Asks the backend for the current state on mount, so a task started earlier is picked up again |
| `onDone` | `(result?: ActionTriggerResult) => void` | — | Called once the action has finished and did not trigger another one. Handed on to `onTriggerAction`, it gets `{navigated: true}` when the follow-up action left for another route in the same tab |
| `onTriggerAction` | `({schema, onDone}) => void` | — | Called when the response asks the UI to run a follow-up action |
| `onResponse` | `((data?: ActionResultMeta) => void) \| null` | notification | Replaces the default success/running/error notification; `null` silences it |
| `onError` | `((error: HttpError) => void) \| false` | notification | Replaces the default error notification; `false` silences it |

## Returns

| Name | Type | Description |
|---|---|---|
| `callAction` | `(data?: ActionParams) => Promise<DataType \| undefined>` | Runs the action; rejects on an HTTP error |
| `isLoading` | `boolean` | A request is in flight |
| `isRunning` | `boolean` | The backend reported `state: "running"` and the hook is polling |
| `isStarted` | `boolean` | `callAction` has been called at least once in this component |
| `isError` | `boolean` | The last call failed |

## Background actions

When the response carries `meta.state === "running"`, the hook polls the same endpoint with `GET`
every 5 seconds until the state changes, and notifies on each transition. A successful action also
refreshes the current record and its schema, so per-record actions and permissions reflect the new
state without a reload.

:::tip
`isBackground: true` is what makes a long task survive a page reload: on mount the hook asks for
the current state before anything is triggered, and resumes polling if the task is still running.
:::

## Example

```tsx
const {callAction, isLoading} = useCallAction({
  resource: 'eshop/order',
  method: 'post',
  path: '/generate-invoice/',
  isBackground: true,
  onDone: () => notify('Invoice generated'),
});

<Button disabled={isLoading} onClick={() => callAction({id: record.id})}>
  Generate invoice
</Button>
```

## See also

- [SchemaAction](../view-components/schema-action-component.md) — the generated action view
- [ButtonProvider](../providers/button-provider.md) — replacing an action button
- [View schema and action schema](../types-and-schemas/view-schema-and-action-schema.md) — how actions are declared
- [Actions and dialogs](/concepts/guides/actions-and-dialogs) — how actions are declared and chained
