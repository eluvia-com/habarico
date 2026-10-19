---
title: FormShell
sidebar_position: 9
---

The React Admin form the edit and create shells wrap: `SimpleForm`, the save toolbar, and the
cross-cutting form machinery around them.

Use it directly for a form that is not an `<Edit>` or a `<Create>` — a dialog collecting action
parameters, a settings screen. Inside a generated view the form already exists; there,
`formActions` on [SchemaEdit](../view-components/schema-edit-component.md) is the smaller change.

## Example

```tsx
import {FormShell, TextInput, NumberInput, SubmitButton} from 'habarico';

<FormShell onSubmit={saveSettings} onPostSubmit={() => notify('Saved')}>
  <TextInput source="name" />
  <NumberInput source="price" />
</FormShell>
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | The inputs |
| `onSubmit` | `SubmitHandler<FieldValues>` | `save` from the save context | Takes over submitting entirely |
| `onPostSubmit` | `() => void` | — | Runs after a successful submit |
| `validate` | `SimpleFormProps['validate']` | — | Form-level validation |
| `record` | `RaRecord` | record from context | Used as the root record and when merging `defaultValues`; the form itself is populated from the React Admin record context |
| `formActions` | `ReactNode` | a `SubmitButton` | Replaces the toolbar content |
| `defaultValues` | `Record<string, unknown>` | — | Values pre-filled into the form |
| `mode` | `SimpleFormProps['mode']` | `'onBlur'` | When validation runs — `'onSubmit'` reports errors only after a submit attempt |

`defaultValues` are merged against the record, so a value the record already carries is not
overwritten by the default.

Validation runs **on blur**: a field reports its error as soon as it loses focus, rather than
letting the user fill the whole form and find out at submit time. That applies both to the
[rules the backend declared](../providers/validator-provider.md) and to any `validate` of your
own. Pass `mode="onSubmit"` where the earlier feedback gets in the way — a wizard step whose
fields are filled out of order, for instance.

## What it sets up

Beyond the form and its toolbar, the shell provides the machinery every generated form relies on:

- `UploadingProvider` — so a save waits for files still uploading,
- `FormInputSourcesProvider` — the registry array boxes use to declare their target,
- `RootRecordContext` — the outer record, for boxes rendering a nested one,
- the **draft controller** — autosaves the form locally and offers to restore it, when
  `draftEnabled` is on,
- the **navigation guard** — the confirm dialog before leaving a dirty form, when
  `navigationGuard` is on,
- the **form-extension registry** — see
  [Form extensions](../utilities/form-extensions.md).

Both flags are set on [SchemaAdmin](../base-components/schema-admin.md) and default to off.

The toolbar is a `ViewToolbar` and follows the same presentation rule as
[ViewContent](./view-content.md)'s bottom bar: an in-flow footer on a page, `DialogActions` inside
a dialog.

## See also

- [EditShell and CreateShell](./edit-and-create-shell.md) — the shells that wrap this one
- [useSubmitForm](../hooks/use-submit-form.md) — submit handling for a form you build without this shell
- [Input components](../input-components/index.md) — what goes inside
