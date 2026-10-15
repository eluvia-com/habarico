---
title: EditShell and CreateShell
sidebar_position: 8
---

A form screen: the React Admin `<Edit>` / `<Create>` controller, the
[FormShell](./form-shell.md) around the inputs, and the
[ViewContent](./view-content.md) frame around that.

The two are the same shell with a different controller — `EditShell` waits for the record to load,
a create has nothing to wait for.

## Example

```tsx
import {EditShell, PropertyFormLayout, TextInput, NumberInput} from '@eluvia/habarico';

<EditShell
  title="Edit product"
  controllerProps={{resource: 'eshop/product', id: productId, mutationMode: 'pessimistic'}}
  onPostSubmit={() => notify('Saved')}
>
  <PropertyFormLayout>
    <TextInput source="name" />
    <NumberInput source="price" />
  </PropertyFormLayout>
</EditShell>
```

## Props

Both shells take the same props; only the type of `controllerProps` differs.

| Name | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | The inputs |
| `controllerProps` | `Omit<EditProps \| CreateProps, 'children'>` | — | Plain React Admin controller props — `id`, `resource`, `transform`, `mutationMode`, `mutationOptions`, … |
| `title` | `ReactNode` | — | Portaled to the layout header |
| `subtitle` | `ReactNode` | — | Rendered under the title |
| `breadcrumbs` | `ReactNode` | — | Injected into the layout's breadcrumb slot |
| `toolbarActions` | `ReactNode` | — | Portaled next to the title |
| `formActions` | `ReactNode` | a submit button | The save / delete bar at the bottom of the form |
| `onSubmit` | `SubmitHandler<FieldValues>` | `save` from the controller | Takes over submitting entirely |
| `onPostSubmit` | `() => void` | — | Runs after a successful save |
| `defaultValues` | `Record<string, unknown>` | — | Values pre-filled into the form |

:::caution
`onSubmit` replaces the save — nothing is persisted unless your handler does it. To only react to
a save, use `onPostSubmit`.
:::

The action bar is `FormShell`'s own toolbar, not `ViewContent`'s `bottomActions` — it has to stay
inside the React Admin form subtree for submit to stay wired. That is why these shells expose
`formActions` and not `bottomActions`.

## See also

- [FormShell](./form-shell.md) — the form context, drafts and the navigation guard
- [Input components](../input-components/index.md) — what goes inside
- [SchemaEdit](../view-components/schema-edit-component.md) — the generated form
