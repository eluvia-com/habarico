---
title: Custom Actions
sidebar_position: 5
---

Declare custom member or collection actions with `register_action`:

**Member action** (operates on a single record — `@record` is available in the block):

```ruby
register_action :close_accounting_period, method: :put, permission: :update do
  AccountingService.instance.lock(@record)
  Habarico::Response.new(message: 'Accounting period closed.')
end
```

**Collection action** (`is_detail: false` — no record is required):

```ruby
register_action :export, is_detail: false, method: :get, permission: :read do
  Habarico::Response.new(message: 'Export complete.')
end
```

**Action with a model** — `model:` is informational only: no deserialisation happens, the block
reads raw `params` and casts them manually. The action's form schema comes from `model:` on the
paired `Habarico::ActionView` (below):

```ruby
register_action :refund,
                is_detail: true,
                method: :put,
                model: RefundRequest,
                permission: :update do
  refund_to_customer = ActiveModel::Type::Boolean.new.cast(params[:refund_to_customer])
  RefundService.instance.refund(@record, Date.today, refund_to_customer)
  Habarico::Response.new(message: 'Guarantee paid back successfully.')
end
```

`register_action` parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `name` | Action name (symbol) | required |
| `method` | HTTP method (`:get`, `:post`, `:put`, `:patch`, `:delete`) | `:put` |
| `is_detail` | Whether the action requires a record ID | `true` |
| `permission` | Permission key checked via `context.can?(permission)` | `:read` |
| `model` | ActiveModel class of the paired `ActionView` form; stored for reference only — request params are not deserialised through it | `nil` |

The block must return a `Habarico::Response` (or a plain string, which is wrapped automatically).

**`Habarico::Response`** — the return value from a `register_action` block:

| Attribute | Description | Default |
|-----------|-------------|---------|
| `message` | User-facing message string | `nil` |
| `state` | Response state (`:success`, `:error`, etc.) | `:success` |
| `action` | Name of a defined action to trigger in the UI after the response | `nil` |

Using `action:` causes the frontend to execute the named action (e.g. open a dialog or redirect) after the server response completes:

```ruby
Habarico::Response.new(message: 'Record approved.', action: 'show')
```

---

**Expose actions in the UI** by including action objects in the `actions` DSL.

**`Habarico::ViewAction`** — open a schema-driven view (form or detail) in a dialog or redirect:

```ruby
actions [
  :show,
  :edit,
  Habarico::ViewAction.new(
    name: 'refund',
    label: 'Pay back guarantee',
    icon: 'Payments',
    view_name: 'refund',
    view_mode: :dialog,
    dialog_width: 'md',
    is_detail: true,
    permission: :update,
    if: ->(c) { c.record && RefundService.instance.can_refund?(c.record, Date.today) },
  ),
]
```

The `if:` lambda receives a `Habarico::Context` and hides the action when it returns falsy.

**`Habarico::ResourceAction`** — a bare endpoint action with no form (optionally shows a confirm dialog before calling the endpoint):

```ruby
Habarico::ResourceAction.new(
  name: 'close_accounting_period',
  label: 'Close period',
  color: :primary,
  icon: 'Lock',
  confirm_dialog_title: 'Close the accounting period?',
  confirm_dialog_message: 'This action cannot be undone.',
  is_detail: false,
  show_in_list: true,
  endpoint_method: :put,
  permission: :create,
  is_background: false,   # when true, action runs in background without blocking the UI
)
```

**`Habarico::ActionView`** — an action that exposes its own schema-driven form (paired with a `register_action` that accepts a `model:`):

```ruby
# In the views array — defines the form schema for the action
Habarico::ActionView.new(
  name: 'refund',
  is_detail: true,
  boxes: [:refund_to_customer],
  model: RefundRequest,
  endpoint_action_name: 'refund',
  endpoint_method: :put,
)
```

**`Habarico::SaveAction`** — a preset save button with name `'save'`, icon `'Save'`, and color `:success`. Use it to add an explicit save button to form views:

```ruby
actions [:show, :edit, Habarico::SaveAction.new]
```

**`Habarico::UploadImagesAction`** — an action that opens an image upload dialog:

```ruby
Habarico::UploadImagesAction.new(
  name: 'upload_photos',
  label: 'Upload photos',
  icon: 'PhotoCamera',
  upload_images_reference: 'unit_photos',       # target resource that stores the images
  upload_images_target: 'unit',                 # foreign key name on the image resource
  upload_images_accept: ['.png', '.jpg'],       # accepted file extensions (array, not a comma-separated string)
  upload_images_image_field: 'photo',           # field on the image resource that holds the uploaded file (required)
  permission: :update,
)
```

**`Habarico::LinkAction`** — a simple URL link in the action bar:

```ruby
Habarico::LinkAction.new(
  name: :open_portal,
  label: 'Open in portal',
  icon: 'OpenInNew',
  link_url: 'https://portal.example.com/orders/{record.id}',
  link_target: 'blank',
)
```

:::caution
`link_target` is `'self'` or `'blank'` — **without** the leading underscore. The value is validated
against the schema enum, so `'_blank'` fails; the frontend prepends the underscore when it renders
the anchor.
:::

**`Habarico::ActionReference`** — reference an action by name inside a `ListBox` toolbar, optionally with a custom `Action` object and a conditional:

```ruby
Habarico::ActionReference.new(
  name: 'create',
  permission: :update,
  if: ->(c) { c.record&.guarantee_usable? },
)

# Or attach a fully configured action object:
Habarico::ActionReference.new(
  name: 'create_reminder_event',
  label: 'New reminder',
  icon: 'AddAlarm',
  color: :primary,
  action: Habarico::ViewAction.new(
    is_detail: false,
    view_name: 'create',
    view_mode: 'redirect',
    endpoint_reference: 'events',
  ),
  permission: :update,
)
```

`ActionReference` attributes:

| Attribute | Description |
|-----------|-------------|
| `name` | Action name (symbol or string) |
| `label` | Override display label |
| `icon` | Override icon name |
| `color` | Override button color |
| `action` | A fully configured `Action` object to use instead of a reference |
| `permission` | Permission required; auto-inferred from `name` (`:create` → `:create`, `:edit` → `:update`, `:delete` → `:delete`, others → `:read`) |
| `if` | Lambda receiving `Habarico::Context` — hides the action when falsy |
| `menu_items` | Array of sub-actions rendered as a dropdown menu |
| `view_mode` | View mode override (`'dialog'`, `'redirect'`) |
| `dialog_width` | Width of the dialog when `view_mode` is `'dialog'` (MUI breakpoint like `'md'` or a CSS width value like `'800px'`) |
| `view_parameters` | Additional parameters passed to the view |
| `view_choices` | Choices offered before the view opens, each with its own parameters |
| `view_keep_linked_parent` | Keeps the parent segments in the URL when the view opens |

**Common action attributes** (shared by all action types):

| Attribute | Description |
|-----------|-------------|
| `show_in_detail` | Whether to show this action on detail (show/edit) views | 
| `show_in_list` | Whether to show this action on the list view |
| `confirm_dialog_title` | Title of the confirmation dialog (any action type) |
| `confirm_dialog_message` | Body text of the confirmation dialog (any action type) |
| `is_detail` | Whether the action is tied to a single record |
| `permission` | Permission checked before the action is offered |
| `if` | Lambda receiving `Habarico::Context` — hides the action when falsy |
| `data` | `ResourceAction` only — extra payload sent with the request |

## See also

- [Actions and dialogs](/concepts/guides/actions-and-dialogs) — the three shapes an action can take
