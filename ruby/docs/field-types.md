---
title: Field types
sidebar_position: 7
---

Which fields a resource exposes, and what type and format each one gets in the schema.

Types are detected from ActiveRecord columns and model attributes — you declare *which* fields
appear, not what they are.

## Declaration

```ruby
fields            [:id, :product, :customer, :placed_at, :delivered_at, :status, :total_amount]
read_only_fields  [:id, :created_at, :updated_at]
write_only_fields [:internal_note]
```

| Declaration | Effect |
|---|---|
| `fields` | Fields readable and writable through the resource |
| `read_only_fields` | Rendered but never accepted from the client |
| `write_only_fields` | Accepted but never returned — passwords, one-way notes |

## Detected types

| JSON type | Format | Source |
|---|---|---|
| `string` | *(none)* | `t.string :name` |
| `string` | `text` | `t.text :description` |
| `string` | `date` | `t.date :delivered_at` |
| `string` | `date-time` | `t.datetime :created_at` |
| `string` | `time` | `t.time :opens_at` |
| `string` | `uuid` | `t.uuid :id` |
| `string` | `choices` | Enum attribute |
| `string` | `relation` | `belongs_to` / `has_one` association |
| `string` | `base64-image` | Image attachment |
| `string` | `base64-file` | File attachment |
| `string` | `range` | Range attribute |
| `string` | `phone`, `czech-ico`, `czech-dic`, `czech-birth-number`, `czech-bank-account`, `rich-text`, `email`, `url`, `password`, `search`, `ai`, `ai-text` | Set explicitly through `FieldReference#format` |
| `number` | *(none)* | `t.decimal :price` / `t.float :weight` |
| `integer` | *(none)* | `t.integer :stock` |
| `boolean` | *(none)* | `t.boolean :is_available` |
| `array` | *(none)* | `has_many` / array attribute |
| `object` | *(none)* | `has_one` object attribute |

## Options

`Habarico::FieldReference` customises one field. It may appear anywhere a bare symbol may —
`fields`, `read_only_fields`, or a view's own field list.

```ruby
fields [
  Habarico::FieldReference.new(
    name: :total_amount,
    label: 'Total',
    help_text: 'Order total in CZK',
    sortable: true,
    text_align: 'right',
  ),
  :status,
  :product,
  :created_at,
]
```

| Option | Type | Description |
|---|---|---|
| `name` | Symbol | The field; required |
| `label` / `short_label` | String | Overrides the translated label; the short one is used in narrow contexts |
| `help_text` | String | Text under the input |
| `format` | String | Overrides the detected format, e.g. `'rich-text'`, `'phone'`, `'czech-ico'` |
| `sortable` / `sort_by` | Boolean / String | Makes the column sortable; `sort_by` can point at a joined column |
| `read_only` / `write_only` | Boolean | Per-field override of the lists above |
| `default_value` | any | Prefilled value in a create form |
| `text_align` | String | `'left'`, `'center'`, `'right'` |
| `relation` | Hash | Relation display options — `show_link`, `link_mode`, `show_create_button`, … |
| `phone` | Hash | `default_region`, `allowed_regions` |
| `icons_key` | String | Icon lookup key for a choices field |
| `resize_width` / `crop_aspect_ratio` | Integer / String | Client-side image handling; the ratio is a string such as `'16:9'` |
| `ai_source_fields` | Array | Context fields for an AI-generated field |
| `max_size` / `accept` | Integer / Array | Overrides the `file_attr`'s derived upload limits (see [File size and type limits](#file-size-and-type-limits)) — set by hand, it wins over whatever the attachment's own validations imply |
| `show_query` / `required_query` | String | Condition expressions driving conditional rendering (identifiers, literals, comparisons, `&&`/`||`/`!`, parentheses); they become `options.dynamic_render` |
| `target` | String | Where a link opens — `'self'` or `'blank'`, stored without the leading underscore |
| `parent` | Symbol | Field forming the hierarchy of a tree relation |
| `action` / `wrapper` | — | Attaches an action or a wrapper to the field |

:::caution
`FieldReference` has no `prefix`, `postfix` or number-format option — those generators are not
implemented on the Ruby side yet. Number formatting is derived automatically: a money attribute
gets `options.number` with the currency from `Habarico::Config.currency`, two fraction digits and
`text_align: 'right'`.
:::

## File size and type limits

A `file_attr`'s `max_size` / `accept` schema options are derived automatically from the
`content_type:` / `size:` validations declared on its underlying attachment with the optional
[`active_storage_validations`](https://github.com/igorkasyanchuk/active_storage_validations) gem
(not a dependency of this gem - a host that does not use it simply gets neither option):

```ruby
class Product < ApplicationRecord
  has_one_attached :photo_attachment
  file_attr :photo, underlying_attachment: :photo_attachment, nature: :image

  validates :photo_attachment,
    content_type: %w[image/png image/jpeg],
    size: { less_than: 5.megabytes }
end
```

`Habarico::FileValidations.for_model` is the reader (`content_type:` -> `accept`, the upper bound
of `size:` -> `max_size`); neither replaces backend validation, which `active_storage_validations`
still enforces on save regardless. With `habarico_enterprise/uploads` installed, `max_size`
additionally folds in the project-wide `Config.max_upload_size` ceiling for a field a
chunked-upload provider serves.

Declaring the field as a `FieldReference` lets you override either directly — `max_size:` /
`accept:` set there always win over what the attachment's validations imply, the same way
`resize_width` or `icons_key` do:

```ruby
fields [
  Habarico::FieldReference.new(name: :photo, max_size: 2.megabytes, accept: ['image/png']),
]
```

A bare symbol declaration (`:photo`) has no such override — it always reflects the attachment's
own validations.

## Generated schema

The flat options above are grouped when the schema is emitted: `icons_key` becomes
`options.choices.icons_key`, `resize_width` and `crop_aspect_ratio` become `options.image.*`, and
`ai_source_fields` becomes `options.ai.source_fields`.

The wire format is snake_case throughout; the frontend camel-cases every key as it receives the
schema, which is why the same option reads as `options.ai.sourceFields` in
[FieldSchema](/node/types-and-schemas/field-schema#fieldoptions).

The frontend picks the component from `type` + `format`:
[SchemaField](/node/field-components/schema-field#schema-mapping) for display,
[SchemaInput](/node/input-components/schema-input#schema-mapping) for forms.

## Example

```ruby
fields [
  :number,
  Habarico::FieldReference.new(name: :customer, relation: {link_mode: 'dialog'}),
  Habarico::FieldReference.new(name: :status, icons_key: 'order_status'),
  Habarico::FieldReference.new(name: :total_amount, text_align: 'right', sortable: true),
  Habarico::FieldReference.new(name: :note, format: 'rich-text'),
]
```

## See also

- [Views](./basic-usage/views.md) — where these fields appear
- [Create/edit view boxes](./schema-and-field-customization/create-edit-view-boxes.md) — arranging them
- [Field components](/node/field-components/) — what renders them
