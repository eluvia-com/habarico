module Habarico
  # The one definition of what a resource offers for sorting - the `sort_by` values its schema
  # advertises. The `field:direction` notation a client writes them in is `Habarico::OrderByHelper`.
  #
  # A field schema's `sort_by` is the value a client puts in `order_by` to sort by that field, so
  # the schema generators and the `order_by` validator have to agree on it. They used to decide
  # separately, and the validator's own rule - a declared field that is also a column - refused
  # part of what the generators advertise: the lower bound of a range field, a column reached over
  # an association, and a `sort_by` written on a `FieldReference` by hand.
  module SortingHelper

    # `sort_by` of a field of the resource schema (`FieldSchemaGenerator`): the field itself when a
    # column or an attribute backs it, the lower bound when a range attribute does, and nothing
    # when the field is not sortable on its own. `attr_name` is the attribute the field is backed
    # by, which only differs from the field name where no range attribute can exist anyway.
    def self.schema_sort_by(definition, model, field_name, attr_name: field_name)
      if definition.sorting_fields.present?
        return definition.sorting_fields.map(&:to_s).include?(field_name.to_s) ? field_name.to_s : nil
      end

      return nil unless Habarico::ReflectionHelper.is_active_record_class?(model)

      # A standard DB column or a standard attribute of the model sorts under its own name.
      Habarico::AttributesHelper.generate_attr_variants(model, field_name).each do |field_name_variant|
        if model.columns_hash[field_name_variant.to_s] || model.attribute_names.include?(field_name_variant.to_s)
          return field_name_variant.to_s
        end
      end

      # A range attribute sorts by its lower bound, as long as that one is a DB column.
      if model.respond_to?(:has_range_attr?) && model.has_range_attr?(attr_name)
        lower_attr_name = model.find_range_attr(attr_name)[:lower_attr_name]
        return lower_attr_name if model.columns_hash[lower_attr_name.to_s]
      end

      # Everything else is not sortable by default. To sort by a "belongs to" association, declare
      # `sort_by` on the field descriptor.
      nil
    end

    # `sort_by` of a field descriptor of a view (`FieldDescriptorGenerator`): a column of an
    # association, addressed as `association__column` the way `order_2` expects it, or whatever the
    # FieldReference declares for itself.
    def self.descriptor_sort_by(model, field_reference)
      name = field_reference.name.to_s
      return name if association_column_path?(model, name)

      field_reference.sort_by
    end

    # Whether `name` is `association__column` - one ActiveRecord association hop to a column, the
    # depth `order_2` sorts by.
    def self.association_column_path?(model, name)
      return false unless Habarico::ReflectionHelper.is_active_record_class?(model)

      hops = name.split(Habarico::FieldPathResolver::RELATION_SEPARATOR)
      return false unless hops.size == 2 && model.reflect_on_association(hops.first.to_sym)

      Habarico::FieldPathResolver.new(model).resolve(name)&.column.present?
    end

    # Every `sort_by` value this resource offers - what a client may ask for in `order_by` - or nil
    # when it has no whitelist to offer: a model without ActiveRecord reflection exposes no columns
    # to check a field name against, so the field names are left to the model itself.
    def self.sortable_fields(definition)
      # What the resource tells the frontend to sort by. The list view schema publishes a
      # `default_sorting` - the resource's, or the view's own - and the frontend puts exactly that
      # in `order_by` on the first request, so refusing it would refuse the backend's own answer.
      declared = declared_sorting_fields(definition)

      return (declared + definition.sorting_fields.map(&:to_s)).uniq if definition.sorting_fields.present?

      model = definition.model
      return nil unless Habarico::ReflectionHelper.is_active_record_class?(model)

      names = declared

      # What the resource schema advertises for each declared field.
      (definition.fields + definition.read_only_fields).each do |field|
        field_name = Habarico::AttributesHelper.field_name(field)
        names << field.sort_by if field.is_a?(Habarico::FieldReference)
        names << schema_sort_by(definition, model, field_name)
      end

      # What the resource's own list views add on top: a column of an association is declared
      # there and never appears among the resource fields.
      list_view_field_references(definition).each do |field_reference|
        names << descriptor_sort_by(model, field_reference)
      end

      # Virtual sortable columns registered on the model with `order_attr`.
      names += model.order_attrs.map { |order_attr| order_attr[:attr_name] } if model.respond_to?(:order_attrs)

      names.compact.map { |name| normalize(name) }.uniq
    end

    # Columns of the primary key of `model` (every one of a composite key), none for a model without
    # one - what every list is finally ordered by, so records tying on the sorted column keep a
    # stable position and a page neither repeats nor skips one.
    def self.primary_key_fields(model)
      Array(model.try(:primary_key)).map(&:to_s)
    end

    # Field names of every ordering this resource advertises: the one the definition falls back to,
    # the one each of its list views publishes on top of that, and the primary key.
    def self.declared_sorting_fields(definition)
      sortings = [definition.default_sorting]
      sortings += definition.normalized_views.select { |view| view.type == :list }.map(&:default_sorting)

      names = sortings.flat_map { |sorting| Habarico::OrderByHelper.field_names(sorting) }

      # The primary key is advertised too, as `pk_field_name` on the resource schema: the frontend
      # sorts by it whenever a list has no sorting of its own (`serializeOrderBy`).
      names += primary_key_fields(definition.model)

      names.uniq
    end

    # A `sort_by` as it arrives in `order_by`. The frontend rewrites the first `.` of the
    # advertised value into `__` before sending it (`serializeOrderBy`), which is also the
    # separator `order_2` splits an association off by.
    def self.normalize(sort_by)
      sort_by.to_s.sub('.', '__')
    end

    # FieldReferences declared in the resource's own list views, including the ones nested in
    # boxes. A box pointing at another resource lists that resource's fields, not this one's.
    def self.list_view_field_references(definition)
      definition.normalized_views.select { |view| view.type == :list }.flat_map do |view|
        field_references(view.boxes)
      end
    end
    private_class_method :list_view_field_references

    def self.field_references(boxes)
      Array(boxes).flat_map do |item|
        case item
        when Habarico::Box then item.reference.present? ? [] : field_references(item.boxes)
        when Habarico::FieldReference then [item]
        when ::String, ::Symbol then [Habarico::FieldReference.new(name: item.to_s)]
        else []
        end
      end
    end
    private_class_method :field_references

  end
end
