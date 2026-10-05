---
title: Custom Schema Generators
sidebar_position: 8
---

Every generator can be replaced with a subclass, per resource. That is the seam for shaping the
schema when the DSL does not reach far enough.

```ruby
class ProductFieldSchemaGenerator < Habarico::FieldSchemaGenerator
  # Override generate_label, generate_type, generate_format, generate_options, … as needed
end

class Apps::Admin::ProductsController < ApplicationController
  include Habarico::Controller

  model Product

  field_schema_generator     ProductFieldSchemaGenerator
  endpoints_schema_generator ProductEndpointsSchemaGenerator
end
```

Every generator descends from `Habarico::AbstractGenerator`, which gives it the `definition` and
`resource_path` of the resource being generated.

## The generator attributes

The DSL exposes one attribute per generator class. They are grouped the same way the classes are:

| Group | Attributes |
|---|---|
| Endpoint / fields | `field_schema_generator`, `fields_schema_generator`, `field_options_generator`, `filter_schema_generator`, `filters_schema_generator`, `search_filter_schema_generator`, `enum_type_generator`, `number_field_options_generator`, `phone_field_options_generator`, `relation_field_options_generator`, `dynamic_render_options_generator`, `method_schema_generator`, `endpoints_schema_generator` |
| View | `view_schema_generator`, `global_view_schema_generator`, `view_endpoint_parameters_generator`, `list_view_parameters_generator`, `detail_view_parameters_generator`, `box_schema_generator`, `box_options_generator`, `field_descriptor_generator`, `filter_descriptor_generator`, `action_descriptor_generator`, `sort_descriptor_generator`, and a `*_box_parameters_generator` for each of the seven parameters blocks a box can carry (`array`, `gallery`, `grid_item`, `list`, `object`, `tab`, `wizard`) |
| Action | `action_schema_generator`, `resource_action_schema_generator`, `global_resource_action_schema_generator`, `link_action_parameters_generator`, `resource_action_parameters_generator`, `resource_action_endpoint_parameters_generator`, `save_action_parameters_generator`, `view_action_parameters_generator`, `upload_files_action_parameters_generator`, `confirm_dialog_properties_generator`, `trigger_action_schema_generator` |
| Menu | `menu_schema_generator`, `menu_group_schema_generator`, `menu_link_parameters_generator`, `menu_view_parameters_generator`, `menu_view_endpoint_parameters_generator` |
| Resource | `local_resource_schema_generator`, `global_resource_schema_generator`, `object_resource_schema_generator`, `action_resource_schema_generator` |

:::caution
The endpoint one is `endpoints_schema_generator` — plural. It generates the whole `endpoints`
block (one `MethodSchema` per HTTP method), which is why the name is not `endpoint_…`.
:::

## Field values

The values of a record are read the same way, by the class in `fields_serializer`
(`Habarico::Serializers::FieldsSerializer` by default). It answers foreign keys for `belongs_to`
and `has_one`, the value of an enum and the plain attribute otherwise. A subclass can add a computed
field; `serializable?` lets it into the response although the record has no method of that name:

```ruby
class ProductFieldsSerializer < Habarico::Serializers::FieldsSerializer
  def readable_fields
    super + ['price_with_vat']
  end

  def serializable?(record, field_name)
    field_name == 'price_with_vat' || super
  end

  def read_attribute(record, field_name)
    field_name == 'price_with_vat' ? record.price * 1.21 : super
  end
end

class Apps::Admin::ProductsController < ApplicationController
  include Habarico::Controller

  model Product
  fields_serializer ProductFieldsSerializer
end
```

## See also

- [Controller setup](./controller-setup.md) — where these attributes are set
- [Views](./views.md) — the higher-level DSL most cases need instead
- [Field types](../field-types.md) — what `generate_type` / `generate_format` decide
