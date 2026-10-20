---
title: Create / Edit View — Boxes
sidebar_position: 4
---

Use `Habarico::Box` to group fields into labeled sections:

```ruby
views [
  Habarico::EditView.new(
    box: Habarico::Box.new(
      boxes: [
        Habarico::Box.new(label: 'Unit', boxes: [:product, :customer]),
        Habarico::Box.new(label: 'Dates', boxes: [:placed_at, :delivered_at]),
        Habarico::Box.new(label: 'Financial', boxes: [:total_amount, :paid_amount]),
      ]
    )
  ),
]
```

**Conditional field visibility** — use `show_query` on `FieldReference` for conditional display driven by a condition expression:

```ruby
Habarico::CreateView.new(
  box: Habarico::GridBox.new(
    boxes: [
      Habarico::Box.new(boxes: [:variable_symbol, :specific_symbol]),
      Habarico::Box.new(boxes: [:maturity_date, :amount_major]),
      Habarico::Box.new(
        boxes: [
          :shipping_method,
          Habarico::FieldReference.new(
            name: :note,
            show_query: "data.shipping_method === 'other'",  # only shown when shipping_method is 'other'
          ),
        ]
      ),
    ]
  )
)
```

**Grid layout** — control column widths on a 12-column grid with `grid_item`:

```ruby
Habarico::EditView.new(
  box: Habarico::GridBox.new(
    boxes: [
      Habarico::Box.new(boxes: [:product, :customer, :status], grid_item: { md: 8 }),
      Habarico::ListBox.new(label: 'Documents', reference: 'documents', target: 'order_id', grid_item: { md: 4 }),
    ]
  )
)
```

`grid_item` takes the responsive breakpoints `xs`, `sm`, `md`, `lg` and `xl` (1–12 columns each); an
omitted breakpoint inherits the one below it. Every box type accepts it, so a grid cell can be a list,
gallery or array box itself — and because the box carrying the span is the box drawing the card, that
card stretches to the height of its row.

:::note
Until HAB-963 the widths lived on a `Habarico::GridItemBox` wrapper with flat `xs`/`sm`/`md`/`lg`/`xl`
attributes. Both the class and the `grid-item` box type are gone: put `grid_item` on the box that
draws the cell. That is also what makes its card stretch to the height of the row — in the wrapper
form only the (invisible) wrapper stretched.
:::

**Tab layout**:

```ruby
Habarico::EditView.new(
  box: Habarico::TabBox.new(
    boxes: [
      Habarico::TabItemBox.new(label: 'Basic Info', boxes: [:product, :customer]),
      Habarico::TabItemBox.new(label: 'Dates', boxes: [:placed_at, :delivered_at]),
      Habarico::TabItemBox.new(label: 'Financial', boxes: [:total_amount, :paid_amount]),
    ]
  )
)
```

For wizard-style multi-step forms use `Habarico::WizardBox` (each `TabItemBox` becomes a step). The container controls navigation via `show_toolbar_navigation` and `validate_steps`; `TabBox` supports `show_toolbar_navigation` for optional previous/next buttons.

**Embedded list** — display a related resource's records inside a form tab:

```ruby
Habarico::EditView.new(
  box: Habarico::TabBox.new(
    boxes: [
      Habarico::TabItemBox.new(label: 'Info', boxes: [:product, :customer, :status]),
      Habarico::ListBox.new(
        label: 'Installments',
        reference: 'order_items',
        target: 'order',
        boxes: [:maturity_date, :amount_major, :status],
        list_toolbar_actions: [:create],
        row_actions: [:edit, :show, :delete],
        default_sorting: 'maturity_date:asc',
      ),
    ]
  )
)
```

**ListBox with external reference** — reference a resource on a different service and build filters dynamically:

```ruby
Habarico::ListBox.new(
  reference: 'events',                        # resource on another service
  extra_filters: ->(c) {
    { content_object_with_child: "product:#{c.record&.original_id}" }
  },
  label: 'Related events',
  boxes: [:date, :label, :employee],
  list_toolbar_actions: [
    Habarico::ActionReference.new(
      name: 'create_reminder_event',
      action: Habarico::ViewAction.new(
        is_detail: false,
        view_name: 'create',
        view_mode: 'redirect',
        view_parameters: ->(c) { { kind: 'reminder', object_id: c.record&.original_id } },
        endpoint_reference: 'events',
      ),
      permission: :update,
      if: ->(c) { c.record&.debt_amount.to_i > 0 },
    ),
  ]
)
```

**Array fields** — inline editing of array or has-many associations:

```ruby
Habarico::EditView.new(
  box: Habarico::Box.new(
    boxes: [
      Habarico::Box.new(label: 'Order', boxes: [:product, :customer]),
      Habarico::ArrayBox.new(label: 'Contacts', target: 'contacts', boxes: [:name, :phone]),
    ]
  )
)
```

**Gallery box** — display a gallery of images from a related resource:

```ruby
Habarico::ShowView.new(
  box: Habarico::TabBox.new(
    boxes: [
      Habarico::TabItemBox.new(label: 'Info', boxes: [:name, :description]),
      Habarico::GalleryBox.new(
        label: 'Photos',
        reference: 'unit_photos',
        target: 'unit',
        image_field: :photo,
        extra_filters: ->(c) { { unit_id: c.record&.id } },
        toolbar_actions: [
          Habarico::ActionReference.new(
            name: 'upload-images',
            action: Habarico::UploadImagesAction.new(
              label: 'Upload photos',
              upload_images_reference: 'unit_photos',
              upload_images_target: 'unit',
              upload_images_image_field: 'photo',
            ),
          ),
        ],
      ),
    ]
  )
)
```

`GalleryBox` attributes: `reference` (resource name), `target` (foreign key target name), `image_field` (field that holds the image), `extra_filters` (lambda returning extra filter hash), `schema_params` (additional schema parameters). Pass `toolbar_actions` (the common `Box` attribute) to render a manage/upload button in the gallery's own toolbar; omit it for a read-only, display-only gallery.

**Object box** — display a nested object (has-one association or embedded object) inline:

```ruby
Habarico::ShowView.new(
  boxes: [
    :name,
    Habarico::ObjectBox.new(
      label: 'Address',
      target: 'address',
      boxes: [:street, :city, :zip],
    ),
  ]
)
```

`ObjectBox` attributes: `label`, `target` (attribute name holding the nested object), `boxes`.

## See also

- [Forms and layout](/concepts/guides/forms-and-layout) — the same layout from the frontend's side
