---
title: Action descriptor reference
sidebar_position: 6
---

Every option an `Action` accepts, what `DefaultActions` puts in a slot instead, and how either one
says which resource it acts on.

A view generator and a box take plain action names when the defaults are fine. Wrap a name in an
`Action` when the button needs to say more about it — another label, a confirmation, a different
resource.

## Declaration

```python
from habarico.schema import Action, ActionScopeType, DefaultActions
from habarico.schema.generators import ListViewSchemaGenerator

ListViewSchemaGenerator(
    toolbar_actions=[DefaultActions(scope=ActionScopeType.LIST)],
    row_actions=[Action(name="archive", label="Archive", icon="Archive", color="error"), "show"],
)
```

`Action` imports from `habarico.schema` and is an alias of `ActionDescriptor`; `DefaultActions` of
`DefaultActionsDescriptor`. Both classes live in `habarico.schema.actions`.

## An action slot holds two kinds of entry

| `type` | Class | Means |
|---|---|---|
| `action` | `Action` | One action, named by `name` |
| `default_actions` | `DefaultActions` | Whatever actions the addressed resource offers |

A slot holding neither renders nothing. The frontend infers no actions from an empty slot — what is
rendered is what the schema says — which is why a generator fills the slots it used to leave empty:

| Slot | Default |
|---|---|
| `ListViewSchemaGenerator.row_actions` | `[DefaultActions(scope="detail")]` — the buttons of one row |
| `ListViewSchemaGenerator.toolbar_actions` | `[DefaultActions()]` |
| `ListViewSchemaGenerator.list_actions` | empty — the filter bar's utilities are not the resource's actions |
| Detail view `toolbar_actions` | `[DefaultActions()]` |
| Detail view `bottom_actions` | the form's own `save`, declared outright |
| `ListBox` `row_actions` / `list_actions` | `[DefaultActions(scope="detail")]` / `[DefaultActions(scope="list")]` — read in the box's resource |

Only a slot nothing was said about carries a default. `None` turns it off and leaves the key out of
the schema; `[]` says the same thing and puts an empty array on the wire. Both render nothing, which
is also what a view class says by declaring `row_actions = None` on itself.

## `Action` options

| Option | Type | Default | Description |
|---|---|---|---|
| `name` (required) | `str` | — | Action name, as the owning resource's schema declares it |
| `label` | `str` | the action's own label | Button caption |
| `icon` | `str` | the action's own icon | Button icon |
| `color` | `ColorType` | the action's own colour | Button colour |
| `action` | `ActionSchema` | — | The action's schema inline, instead of looking `name` up |
| `reference` | `ResourceReference \| str \| CURRENT` | the schema the descriptor is rendered in | Where the action is defined and what it runs against — see below |
| `confirm_dialog_title` | `str` | the action's own dialog | Title of a dialog shown before the action runs |
| `confirm_dialog_message` | `str` | the action's own dialog | Message of that dialog |
| `menu_items` | `list[Action] \| list[str]` | — | Sub-actions, rendered as a menu under this button |
| `view_mode` | `ViewModeType` | the target view's own mode | `redirect`, `dialog` or `sidepanel` |
| `view_dialog_width` | `DialogWidthType \| str` | — | Dialog width; only with `view_mode="dialog"` |
| `view_parameters` | `dict[str, str]` | — | Query the target view is opened with |
| `view_choices` | `list[ActionViewChoice]` | — | Turns the button into a menu, one entry per choice, each with its own parameters |
| `view_keep_linked_parent` | `bool` | — | Keeps the parent context in the URL when the target is another resource |

The five `view_*` options compose one `view` object on the descriptor; the two `confirm_dialog_*`
ones compose a `confirm_dialog`. A dialog needs **both** halves — the client takes the override
whole rather than merging it with the action's own, so one half alone is refused.

`SaveActionDescriptor`, `ExportActionDescriptor` and `UploadImagesActionDescriptor` are `Action`
subclasses carrying their own defaults and parameters; see
[Form schema generators](./form-schema-generators.md).

## `DefaultActions` options

| Option | Type | Default | Description |
|---|---|---|---|
| `reference` | `ResourceReference \| str \| CURRENT` | the resource the schema is generated for | Whose defaults expand here |
| `scope` | `ActionScopeType \| str` | `all` | Which of them — see below |

| `scope` | Expands to |
|---|---|
| `detail` | The record-scoped actions (`is_detail`): show, edit, delete — the per-row buttons |
| `list` | The collection-scoped ones: create, export, bulk operations |
| `all` | Both |

The client loads the addressed resource's schema and replaces the entry with one ordinary descriptor
per action it offers. Expansion is the frontend's on purpose: a backend cannot know a foreign
service's actions, and splitting the filtering rule over two backend languages would let the two
drift apart.

## Addressing a resource

Both entries take a `reference`, and leaving it out means the resource whose schema the entry is read
in — the resource the schema was generated for, or, inside a `ListBox`'s `list` parameters, the one
the box points at. That is why none of the generated defaults carries an address. A string is a
resource name, bare (`"order_item"`) or prefixed with a service (`"school/teacher"`), and is split
into the address.

`ResourceReference` spells the parts out where a name is not enough:

| Part | Type | Description |
|---|---|---|
| `resource` (required) | `str` | Resource name, without a service |
| `service` | `str` | The service the resource belongs to; absent means this one |
| `record_pk` | `PkType` | The one record to act on |
| `action_name` | `str` | The action whose own schema is addressed |
| `params` | `dict[str, str]` | Query the addressed request carries |

An address is either omitted or complete: a `ResourceReference` without a resource is refused. It is
a plain value object, so it keeps the two halves apart and a prefixed name is refused as well —
write `ResourceReference("teacher", service="school")`, or pass the plain string `"school/teacher"`
as the `reference` and let it be split on the way in. The two sentinels below stand **in place of**
an address, never inside one.

`CURRENT` is the address of the request the schema is being served for:

```python
from habarico.schema import CURRENT, Action

Action(name="approve", reference=CURRENT)
```

The serializer swaps it for what the schema route stamped, whole — the resource, the record when the
route has one, the action segment when the schema was served from an action route, and the
`_target` / `_source` pair that ties the request to the record it was asked for. Nothing is merged:
an author who needs a different record, action or query writes the address out
(`ResourceReference("article", record_pk=7)`).

The resource comes from the view's own admin rather than the ambient one, so a descriptor inside a
`ListBox` still means the page it was written on and not the resource the box lists. Omitting
`reference` altogether means the same thing, which is why every generated default does that;
`CURRENT` is for saying it where omitting is not an option, such as beside another descriptor that
does name a resource.

`LIST` is the other way round: the resource the surrounding box lists. A box's header toolbar renders
in the parent's context, so a button meant for the listed resource has to name it — and `LIST` names
it without repeating what the box already carries:

```python
from habarico.schema import LIST, ActionScopeType, DefaultActions
from habarico.schema.boxes import ListBox

ListBox(
    reference="order_item",
    target="order",
    toolbar_actions=[DefaultActions(reference=LIST, scope=ActionScopeType.LIST)],
)
```

It resolves against the address the box stamps for its own subtree: the collection it lists, with the
query the box's own schema request carries — its `schema_params` plus the `_target` / `_source` pair
naming the record the surrounding view renders. The header needs that pair, since the button is
rendered in the parent's context; the box's own `row_actions` and `list_actions` need none of it,
being read in the schema the box already requested with the same query.

`GalleryBox` stamps the same way, and outside such a box the sentinel is refused.

## Generated schema

```json
{
  "row_actions": [
    {"type": "action", "name": "archive", "label": "Archive", "icon": "Archive", "color": "error"},
    {"type": "default_actions", "scope": "detail"}
  ],
  "toolbar_actions": [
    {"type": "default_actions", "reference": {"resource": "order_item"}, "scope": "list"}
  ]
}
```

The row slot belongs to the resource it is rendered in, so it carries no address; the toolbar entry
above is one an author pointed at another resource, which is the case that needs one.

## Example

A product's edit view lists its photos, and the photo resource's own buttons go in the box header:

```python
from habarico import ModelAdmin
from habarico.schema import Action, ActionScopeType, DefaultActions
from habarico.schema.boxes import Box, ListBox, TabBox
from habarico.schema.generators import EditViewSchemaGenerator

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    view_schema_generators = [
        EditViewSchemaGenerator(box=TabBox(boxes=[
            Box(label="Product", boxes=["name", "sku", "price"]),
            ListBox(
                label="Photos",
                reference="photo",
                target="product",
                boxes=["file", "created_at"],
                # the photo resource's collection actions, in the box header
                toolbar_actions=[DefaultActions(reference="photo", scope=ActionScopeType.LIST)],
                # a row acts on the photo it renders, so its buttons need no address
                row_actions=[
                    Action(
                        name="delete",
                        confirm_dialog_title="Delete photo",
                        confirm_dialog_message="The file is removed from storage too.",
                    ),
                ],
            ),
        ]))
    ]
```

## See also

- [Box reference](./box-reference.md) — the slots a box offers
- [List view schema generators](./list-view-schema-generators.md) — the slots a list view offers
- [Action view schema generator](./action-view-schema-generator.md) — declaring a non-CRUD action in the first place
- [Configuration validation](../basic-usage/configuration-validation.md) — what is checked about these names at registration
- [View slots](/node/view-components/view-slots-title-toolbar-actions-form-actions-list-actions) — the same slots on the frontend's side, and what renders a descriptor
