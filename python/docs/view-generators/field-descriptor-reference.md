---
title: Field descriptor reference
sidebar_position: 5
---

Every option a `Field` accepts, and what each one produces in the schema.

A view generator takes plain field names when the defaults are fine. Wrap a name in a `Field` when
the view needs to say more about it — a different label, an alignment, a condition, an action.

## Declaration

```python
from habarico.schema import Field
from habarico.schema.generators import ListViewSchemaGenerator

ListViewSchemaGenerator(fields=[
    "name",
    Field(name="price", short_label="Price", text_align="right", postfix=" CZK"),
    Field(name="stock", sortable=True, sort_by="stock_total"),
])
```

`Field` imports from `habarico.schema`; it is an alias of the underlying `FieldDescriptor` class,
which lives in `habarico.schema.fields`.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `name` (required) | `str` | — | Field name, as exposed by the serializer |
| `label` | `str` | label from the serializer | Column header and form label |
| `short_label` | `str` | — | Label used where space is tight, e.g. a datagrid column |
| `help_text` | `str` | help text from the model | Hint under the input |
| `sortable` | `bool` | from the admin's `ordering_fields` | Whether the list may be sorted by the column |
| `sort_by` | `str` | `name` | Field the backend sorts by when the column is clicked |
| `read_only` | `bool` | from the serializer | Renders the value but never accepts it |
| `write_only` | `bool` | from the serializer | Accepts the value but never returns it |
| `default_value` | `Any` | — | Initial value in a create form |
| `action` | `Action \| str \| ActionSchema` | — | Makes the value a button running that action |
| `wrapper` | `FieldWrapperProperties` | — | Groups several fields into one cell — see below |
| `show_query` | `str` | — | Condition expression; the field disappears when it is falsy |
| `required_query` | `str` | — | Condition expression; the field becomes required when it is truthy |
| `text_align` | `TextAlignType` | `"left"` | `"left"`, `"right"` or `"center"` |
| `prefix` | `str` | — | Text rendered before the value |
| `postfix` | `str` | — | Text rendered after the value |
| `relation` | `RelationFieldOptions` | — | Behaviour of a relation field — see below |
| `validators` | `list[ValidatorRule]` | rules extracted from the serializer field | Frontend validation rules — see [Validation rules in the schema](../basic-usage/admin-fields.md#validation-rules-in-the-schema) |

`show_query` and `required_query` land under `options.dynamic_render` in the schema, which is what
the frontend's conditional rendering reads. Both are evaluated against the current form data or
record. They are condition expressions with a fixed grammar — identifiers with dot paths, string /
number / boolean / `null` / `undefined` literals, comparisons (`==`, `!=`, `===`, `!==`, `<`, `<=`,
`>`, `>=`), `&&` / `||` / `!` and parentheses — interpreted by the frontend, never executed as
JavaScript. Anything outside that grammar is rejected as an invalid expression.

## `RelationFieldOptions`

Applies to fields with `format: "relation"` or `"tree-relation"`.

| Option | Type | Default | Description |
|---|---|---|---|
| `filters` | `list[KeyValue]` | — | Restricts the choices offered |
| `sort` | `SortDescriptor` | — | Orders the choices |
| `show_link` | `bool` | — | Renders the value as a link to the related record |
| `link_mode` | `ViewModeType` | — | `redirect`, `dialog` or `sidepanel` |
| `dialog_width` | `DialogWidthType \| str` | — | `link_mode="dialog"` only — a breakpoint (`"xs"`…`"xl"`) or any CSS width |
| `keep_linked_parent` | `bool` | — | Keeps the parent in the URL when following the link |
| `show_edit_button` | `bool` | — | Adds an inline edit button next to the picker |
| `show_create_button` | `bool` | — | Adds an inline create button next to the picker |
| `preserve_order` | `bool` | `True` when `sort` is unset, else `False` | Keeps the order of values as stored, instead of re-sorting |
| `parent` | `str` | — | Field forming the hierarchy of a `tree-relation` |

:::caution
`preserve_order` defaults from `sort`, not from `None`: setting a `sort` silently turns order
preservation off. Set both explicitly when you want a sorted picker over an order-preserving value.
:::

## `FieldOptions`

The same options can be given as a `FieldOptions` object where an API takes one, plus the
format-specific groups:

| Option | Type | Description |
|---|---|---|
| `choices` | `ChoicesFieldOptions` | `icons_key` — key into the frontend's `iconsMap`, giving each enum chip an icon |
| `image` | `ImageFieldOptions` | `resize_width` in pixels and `crop_aspect_ratio` (e.g. `1.5` for 3:2), applied before upload |
| `ai` | `AiFieldOptions` | `source_fields` — the fields used as context when predicting this one |
| `number` | `NumberFieldOptions` | `Intl.NumberFormat` options: `style` (`"currency"` / `"unit"`), `currency`, `unit`, `minimum_fraction_digits`, `maximum_fraction_digits` |
| `phone` | `PhoneFieldOptions` | `default_region` and `allowed_regions` of the country selector |
| `upload` | `UploadFieldOptions` | Chunked-upload transport — injected by the uploads app, not written by hand |
| `target` | `LinkTargetType \| str` | Where a file or url link opens |
| `validators` | `list[ValidatorRule]` | Frontend validation rules — see [Validation rules in the schema](../basic-usage/admin-fields.md#validation-rules-in-the-schema) |

:::caution
`target` is stored **without** the leading underscore — `"blank"`, not `"_blank"`. The frontend
prepends it when it renders the link.
:::

## `FieldWrapper`

Renders several fields as one cell — a street and a house number in a single column.

```python
from habarico.schema import FieldWrapper

FieldWrapper(name="address", label="Address", fields=["street", "city"], divider=", ")
```

| Option | Type | Default | Description |
|---|---|---|---|
| `name` (required) | `str` | — | Name of the resulting pseudo-field |
| `fields` (required) | `Fields` | — | Fields to combine |
| `divider` | `str` | — | Text placed between them |
| `label` / `short_label` | `str` | — | As on a plain field |
| `show_query` | `str` | — | Condition for showing the whole group |
| `text_align` | `TextAlignType` | — | Alignment of the combined cell |

## `FieldAction`

Turns a field into a trigger for an action, without repeating the name twice.

```python
from habarico.schema import FieldAction

FieldAction(name="approve", label="Approve")
```

It is a `Field` whose `action` defaults to its own `name`, so the two lines below are the same
thing:

```python
FieldAction(name="approve")
Field(name="approve", action="approve")
```

It accepts `name`, `label`, `short_label`, `action`, `show_query` and `text_align`.

## Generated schema

A descriptor becomes one entry of the view's `fields`, and the frontend maps it to a component from
the field's `type` and `format` — the descriptor only shapes how that component is configured.

Note where each option lands: `label`, `short_label`, `sortable`, `sort_by`, `read_only`,
`write_only`, `default_value`, `action` and `wrapper` are properties of the descriptor itself, while
`text_align`, `prefix`, `postfix`, `relation`, `show_query` and `required_query` are collected into
`options`.

```json
{"type": "field", "name": "price", "short_label": "Price",
 "options": {"text_align": "right", "postfix": " CZK"}}
```

`options` is omitted entirely when none of the options that feed it is set.

## See also

- [List view schema generators](./list-view-schema-generators.md) — where descriptors are most used
- [Form schema generators](./form-schema-generators.md) — descriptors inside boxes
- [Admin fields](../basic-usage/admin-fields.md) — choosing which fields exist in the first place
- [SchemaField](/node/field-components/schema-field) — the frontend dispatcher reading this
