---
title: Box reference
sidebar_position: 6
---

Every box class, and the parameters each one adds on top of the common ones.

Boxes are the layout of a create, edit or show view — see
[Form schema generators](./form-schema-generators.md) for how they are composed. This page is the
list to check a parameter against.

## Declaration

```python
from habarico.schema import Box, GridBox, ListBox, TabBox, TabItemBox
from habarico.schema.generators import EditViewSchemaGenerator

EditViewSchemaGenerator(box=TabBox(boxes=[
    TabItemBox(label="Product", boxes=[
        GridBox(boxes=[
            Box(label="Basics", grid_item={"md": 8}, boxes=["name", "sku"]),
            Box(label="Pricing", grid_item={"md": 4}, boxes=["price", "vat_rate"]),
        ]),
    ]),
    TabItemBox(label="Orders", boxes=[ListBox(reference="eshop/order", target="product")]),
]))
```

All classes import from `habarico.schema` (or `habarico.schema.boxes`).

## The classes

| Class | `type` | Renders as |
|---|---|---|
| `Box` | `simple` | A labelled stack of fields — the fallback |
| `GridBox` | `grid` | A responsive 12-column grid |
| `GridFieldsBox` | `grid` | A grid with one field per column — a shorthand |
| `TabBox` | `tab` | Tabs |
| `WizardBox` | `wizard` | A stepped form |
| `TabItemBox` | `tab-item` | One tab or one wizard step |
| `ListBox` | `list` | An embedded list of a related resource |
| `GalleryBox` | `gallery` | An image carousel from a related resource |
| `ObjectBox` | `object` | The properties of a nested serializer |
| `ArrayBox` | `array` | A repeatable group of fields |

## Common parameters

Accepted by every class (they come from `BaseBox`):

| Parameter | Type | Default | Description |
|---|---|---|---|
| `name` | `str` | the box's index | Identifies the box; tab and wizard state is keyed by it |
| `label` | `str` | `None` | Section heading; on its own it turns the card frame on |
| `card` | `bool` | `None` | Card frame: `True` always, `False` never (even with a label), `None` leaves it to the frontend — see below |
| `collapsible` | `'open' \| 'closed'` | `None` | Makes the box collapsible; the value is the initial state |
| `boxes` | `list[BaseBox \| str \| Field]` | `None` | Children: nested boxes, field names, or `Field` descriptors |
| `read_only` | `bool` | `False` | Renders every field inside as a display field |
| `show_query` | `str` | `None` | Condition expression; the box disappears when it is falsy |
| `required_query` | `str` | `None` | Condition expression; the box's fields become required when it is truthy |
| `toolbar_actions` | `Actions` | `None` | Buttons in the box header |
| `bottom_actions` | `Actions` | `None` | Buttons below the box's fields |
| `grid_item` | `GridItem \| dict` | `None` | Column span inside the parent `GridBox` — see [`grid_item`](#grid_item) |

`show_query` and `required_query` are stored under `options.dynamic_render`.

Left at `None`, `card` is decided by the frontend: a box takes the card when it has a label,
toolbar actions or is collapsible, and the view's first box takes it on a page surface — inside a
dialog or a side panel the overlay is already the card. A first box that only wraps other boxes
(`Box` without fields, `GridBox`, `TabBox`, `WizardBox`) hands that default to its children, so the
card lands on the first box holding fields. Pass `card=False` to keep a labelled box
card-less; its label then renders as a plain section heading.

## `TabBox` and `WizardBox`

| Parameter | Type | `TabBox` default | `WizardBox` default |
|---|---|---|---|
| `show_toolbar_navigation` | `bool` | `False` | `True` |
| `validate_steps` | `bool` | — | `True` |

The children should be `TabItemBox` — its `label` is required, and it becomes the tab caption or
step caption. In the schema these land under a `tab` / `wizard` object:

```json
{"type": "wizard", "wizard": {"show_toolbar_navigation": true, "validate_steps": true}}
```

## `grid_item`

How wide a box is inside its parent `GridBox`. It is a placement rather than a box type, so every
class accepts it — pass a `GridItem` descriptor or a plain dict of breakpoint spans:

```python
from habarico.schema import Box, GridBox, GridItem, ListBox

GridBox(boxes=[
    Box(label="Unit management", grid_item={"md": 3}, boxes=["owner", "manager"]),
    ListBox(label="Documents", grid_item=GridItem(md=9), reference="document", target="unit"),
])
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `xs`, `sm`, `md`, `lg`, `xl` | `int` | `None` | Column span (1–12) at that breakpoint |

A breakpoint that is not set inherits the span of the one below it (`xs` → `sm` → `md` → `lg` →
`xl`), so `{"md": 9}` on its own is a complete placement. Omitting `grid_item` entirely lets the
frontend compute the spans from the number of cells. Mixing explicit and computed cells in one grid
does not work — one cell carrying `grid_item` switches the whole grid to explicit mode, and every
cell without one then takes a full row.

Because the box that carries the span is the box that draws the card, its card stretches to the
height of its row like every other cell in it.

:::note
Until HAB-963 the spans lived on a wrapper box, `GridItemBox(md=9, boxes=[ListBox(...)])`, and on
the `grid-item` box type. Both are gone: pass `grid_item` to the box that draws the cell. Besides
being one concept in one place, it is what makes the card stretch to the height of its row — in the
wrapper form only the (invisible) wrapper stretched.
:::

## `GridFieldsBox`

A shorthand for "one field per grid column": it takes the fields positionally and wraps each in its
own `Box`.

```python
GridFieldsBox("price", "vat_rate", "stock")
```

It also accepts `xs`, `sm`, `md`, `lg` and `xl` and passes them to every generated box as its
`grid_item`, so `GridFieldsBox("price", "vat_rate", "stock", md=4)` lays the three fields out three
to a row on medium screens.

## `ListBox`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `reference` (required) | `str` | — | Resource to list |
| `target` | `str` | `None` | Foreign key pointing back at the parent record |
| `boxes` | `Fieldset` | `None` | Which columns the embedded table shows, and in what order |
| `row_actions` | `Actions` | `None` | Buttons in the row action column |
| `list_toolbar_actions` | `Actions` | `None` | Actions in the **table's** own toolbar, e.g. create |
| `list_actions` | `Actions` | `None` | Utility actions next to the filter bar (export, print, …) |
| `filters` | `Filters` | `None` | Filters offered on the embedded list |
| `default_sorting` | `SortingOrStr` | `None` | Initial sort — a `Sorting` object, or a Django-style string (`"placed_at"` ascending, `"-placed_at"` descending) |
| `extra_filters` | `dict` | `None` | Static filters applied on top, invisible to the user |
| `sortable_field_name` | `str` | `None` | Field storing the order; enables drag-and-drop sorting |
| `sortable_sort_for_filters` | `dict` | `None` | Filters under which reordering is allowed |
| `schema_params` | `dict[str, str]` | `None` | Extra params sent when fetching the reference's schema |
| `single_click_action` | `ActionDescriptor \| str` | `None` | Action on a single row click; a plain name is normalized into a descriptor |
| `double_click_action` | `ActionDescriptor \| str` | auto: show → edit → nothing | Action on a double click |

:::caution
`toolbar_actions` and `list_toolbar_actions` are two different slots. `toolbar_actions` is the
common `BaseBox` parameter: bound to the **parent** record and rendered in the box header.
`list_toolbar_actions` is bound to the **referenced** resource and is emitted inside the `list`
parameters, where the frontend renders it in the table's own toolbar. Passing the actions to the
wrong one puts them on the wrong record.
:::

## `GalleryBox`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `reference` (required) | `str` | — | Resource holding the images |
| `image_field` (required) | `str` | — | Field containing the image (`{url, filename}`) |
| `target` | `str` | `None` | Foreign key pointing back at the parent |
| `filters` | `Filters` | `None` | Filters offered on the underlying list |
| `default_sorting` | `SortingOrStr` | `None` | Initial sort |
| `extra_filters` | `dict` | `None` | Static filters applied on top |
| `schema_params` | `dict[str, str]` | `None` | Extra params sent when fetching the reference's schema |

A gallery box is always read-only — it passes `read_only=True` up to `BaseBox` regardless of
what you set. So does `ListBox`.

## `ObjectBox`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `target` (required) | `str` | — | Name of the nested serializer field |

Children are named without the `target.` prefix; the frontend binds them under it.

## `ArrayBox`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `target` (required) | `str` | — | Name of the nested serializer field holding the array |
| `inline` | `bool` | `True` unless a child is a box | Renders items as table-like rows instead of stacked groups |
| `listed_by_field_name` | `str` | `None` | Switches to the chip picker; names the item field holding the enum value |
| `listed_by_other_values` | `list[str \| int]` | `None` | Enum values kept out of the fixed rows and left addable |

The `inline` default is computed: an array whose children are plain fields renders inline, one that
contains a nested box does not. Pass it explicitly to override that.

## See also

- [Form schema generators](./form-schema-generators.md) — composing these into a view
- [Field descriptor reference](./field-descriptor-reference.md) — the options of the fields inside
- [Nested serializers](../basic-usage/nested-serializers.md) — the serializers `ObjectBox` and `ArrayBox` need
- [Box components](/node/box-components/) — what each box renders as on the frontend
- [Box types reference](/ruby/schema-and-field-customization/box-types-reference) — the Ruby equivalent
