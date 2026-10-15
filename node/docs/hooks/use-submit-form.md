---
title: useSubmitForm
sidebar_position: 10
---

Wraps a form submit handler in the notification and error handling the generated forms use.

Use it for a form you built by hand — a settings screen, a custom dialog — so its success and error
messages look like the rest of the admin and its field errors land on the right inputs.

## Signature

```typescript
import {useSubmitForm} from '@eluvia/habarico';

const {handleSubmit, isLoading} = useSubmitForm(
  onSubmit,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  tooManyRequestsMessage
);
```

## Parameters

Positional, not an options object.

| # | Name | Type | Description |
|---|---|---|---|
| 1 | `onSubmit` (required) | `SubmitHandler<T>` | Does the work; throw to signal failure |
| 2 | `onSuccess` | `() => void` | Called after a successful submit, once the notification is shown |
| 3 | `onError` | `(error: Error) => void` | Called on every failure, including validation ones |
| 4 | `successMessage` | `string \| null` | Message on success; `null` shows none. Defaults to `ra.message.successfully_done` |
| 5 | `errorMessage` | `string` | Fallback message when the error carries no text of its own. Defaults to `ra.message.invalid_form` |
| 6 | `tooManyRequestsMessage` | `string` | Message shown specifically for a `429` |

## Returns

| Name | Type | Description |
|---|---|---|
| `handleSubmit` | `(data: FieldValues) => Promise<…>` | Pass it to react-hook-form's `handleSubmit` |
| `isLoading` | `boolean` | True while the submit is in flight — bind it to the save button |

When the backend answers with field errors (`body.errors`), `handleSubmit` **returns** them so
react-hook-form can attach them to the matching inputs. A submit that succeeds returns nothing.

## Behaviour

The failure is classified before it is reported:

| Failure | What the user sees |
|---|---|
| `429` and `tooManyRequestsMessage` is set | That message |
| `HttpError` with a non-empty `body.errors` | Nothing global — the errors go to the fields |
| `HttpError` with an empty `body.errors` | The message extracted from the error, else `errorMessage` |
| Anything else | The same extracted-or-fallback message |

`isLoading` is cleared in a `finally`, so it is safe even when `onSubmit` throws.

## See also

- [FormShell](../layout-components/form-shell.md) — the save toolbar to pair it with
- [SchemaEdit](../view-components/schema-edit-component.md) — the generated form doing the same thing
- [useCallAction](./use-call-action.md) — running a backend action instead of saving a form
