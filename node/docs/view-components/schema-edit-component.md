---
title: SchemaEdit
sidebar_position: 5
---

Renders the edit form of an existing record from its schema and submits the changes.

A resource gets this view automatically. Mount it explicitly to intercept the submit, add form
actions, or replace the generated form.

## Example

```tsx
<SchemaResource
  name="eshop/product"
  edit={
    <SchemaEdit
      formActions={<><SchemaFormActions /><SaveAndContinueButton /></>}
    />
  }
/>
```

## Props

On top of these it accepts React Admin's `EditProps` except `children`.

| Name | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `'edit'` | Which edit view of the schema to render |
| `children` | `ReactNode` | generated form | Replaces the generated inputs |
| `onSubmit` | `SubmitHandler<FieldValues>` | default update call | Takes over submitting entirely |
| `onPostSubmit` | `() => void` | — | Runs after a successful save |
| `title` | `ReactNode` | `<SchemaViewTitle />` | Card header |
| `toolbarActions` | `ReactNode` | `<SchemaViewToolbarActions />` | Buttons next to the title |
| `formActions` | `ReactNode` | `<SchemaFormActions />` | Buttons in the form toolbar; defaults to a save button |

The slots are described in detail on
[View slots](./view-slots-title-toolbar-actions-form-actions-list-actions.md).

## Read-only fields

A field the schema marks `readOnly` is rendered by the *field* components, not the inputs — the
value is visible but not editable, and it is not submitted. This is how per-record permissions
reach the form: the backend can return the same view with a different set of read-only fields
depending on who is asking.

:::tip
`draftEnabled` on [SchemaAdmin](../base-components/schema-admin.md) keeps unsaved changes locally
and offers them back the next time the same record is opened — useful for long forms where a lost
tab costs real work.
:::

## See also

- [SchemaCreate](./schema-create-component.md) — the same form for a new record
- [SchemaShow](./schema-show-component.md) — the read-only view
- [Property layouts](../layout-components/property-layouts.md) — how the inputs are arranged
