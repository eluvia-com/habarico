---
title: useRecordLink
sidebar_position: 16
---

Turns "open this record" into a click handler and, when the target opens on an overlay, the dialog
that hosts it.

The generated views wire it up behind every record chip. Reach for it when you build a control that
should open a record the way the rest of the admin does — honouring ctrl-click, in-place navigation
inside a dialog, and docking into the side panel.

## Signature

```typescript
import { useRecordLink } from "@eluvia/habarico";

const { handleClick, dialog } = useRecordLink({
  viewType: "show",
  linkMode: "dialog",
  renderContent,
});
```

It reads the record and the resource from context, so it opens whatever record it is mounted under.

## Parameters

| Name               | Type                            | Default  | Description                                                                                                  |
| ------------------ | ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `viewType`         | `'show' \| 'edit'`              | —        | Which view to open; without it the link is not offered at all                                                |
| `keepLinkedParent` | `boolean`                       | `false`  | Keeps the linked parent segments in the redirect path                                                        |
| `linkMode`         | `'page' \| 'dialog' \| 'panel'` | `'page'` | Surface the target opens on                                                                                  |
| `dialogWidth`      | `string`                        | `"md"`   | MUI breakpoint or CSS width, for `linkMode: 'dialog'`                                                        |
| `changeView`       | `(props) => boolean`            | —        | Swaps the content of the dialog the link was clicked in, in place; return `false` to fall back to a redirect |
| `openSidePanel`    | `(props) => boolean`            | —        | Docks the record into a side panel; return `false` to fall back to a dialog                                  |
| `renderContent`    | `(props) => ReactNode`          | —        | Renders the body of the overlay                                                                              |

`changeView` and `openSidePanel` receive `{resource, viewType, viewName, id}`; `renderContent` also
gets `data` and an `onClose`.

## Returns

| Name          | Type                                   | Description                                                                |
| ------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| `handleClick` | `(e: MouseEvent) => void \| undefined` | Bind to the element's `onClick`; `undefined` when there is no view to open |
| `dialog`      | `ReactNode`                            | Render alongside the element — it is empty unless an overlay is open       |

`handleClick` is `undefined` whenever `viewType`, the record or the resource is missing. That is the
signal to render the control as inert rather than as a dead link.

## Behaviour

- **`linkMode: 'page'`** navigates, resolving the modifier keys into same tab / new tab / new
  window — so ctrl-click keeps working without extra code.
- **`linkMode: 'panel'`** docks into the side panel, unless the click came from inside that same
  panel: docking it again would replace the panel with itself, so that case opens a dialog on top.
- **Clicked from inside a dialog**, an overlay link asks `changeView` to swap the dialog's content
  in place instead of stacking a second dialog; a falsy return redirects instead.

:::caution
`linkMode: 'dialog'` or `'panel'` without a `renderContent` throws. There is nothing sensible to
put in the overlay, and failing at the call site beats opening an empty dialog at runtime.
:::

## useSchemaRecordLinkOptions

The schema half of the same link. It resolves the schema-level `link` onto a concrete `viewType` —
a resource may expose no show view, or no edit view, in which case no link is offered — and
supplies the schema's own view router as `renderContent`, plus `changeView` and `openSidePanel`
from the surrounding view.

```typescript
import { useRecordLink, useSchemaRecordLinkOptions } from "@eluvia/habarico";

const { handleClick, dialog } = useRecordLink({
  ...useSchemaRecordLinkOptions({ link: "show" }),
  linkMode: "dialog",
  dialogWidth: "lg",
});
```

| Name   | Type                          | Default | Description                                                                        |
| ------ | ----------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `link` | `boolean \| 'show' \| 'edit'` | —       | Whether to link, and to which view; `true` prefers `show` and falls back to `edit` |

It returns only the four options a schema can supply — `viewType`, `changeView`, `openSidePanel`
and `renderContent`. `keepLinkedParent`, `linkMode` and `dialogWidth` are the caller's own and go
to `useRecordLink` directly, which is why they do not appear here.

:::tip
It stops at the options rather than calling `useRecordLink` for you, because
[RecordRepresentationChip](../field-components/record-representation-chip.mdx) calls the hook
itself — spread these into its props and let it do the resolving.
:::

## See also

- [RecordRepresentationChip](../field-components/record-representation-chip.mdx) — the chip both hooks are built for
- [SchemaReferenceField](../field-components/reference-field.mdx) — a foreign key rendered as a linked chip
- [useRowClick](./use-row-click.md) — the same idea for datagrid rows
