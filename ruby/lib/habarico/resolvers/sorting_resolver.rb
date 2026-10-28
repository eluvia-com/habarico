module Habarico
  # The `sort_by` a field of `model` advertises - the value a client puts in `order_by` to sort by
  # that field. The schema generators publish it and `Habarico::OrderByValidator` accepts it, so
  # both read it from here.
  class SortingResolver
    # `sorting_fields` is the definition's whitelist; when present it alone decides what a resource
    # field sorts by.
    def initialize(model, sorting_fields: nil)
      @model = model
      @sorting_fields = sorting_fields
    end

    # `sort_by` of a field of the resource schema (`FieldSchemaGenerator`): the field itself when a
    # column or an attribute backs it, the lower bound when a range attribute does, and nothing
    # when the field is not sortable on its own. `attr_name` is the attribute the field is backed
    # by, which only differs from the field name where no range attribute can exist anyway.
    def field_sort_by(field_name, attr_name: field_name)
      if @sorting_fields.present?
        return @sorting_fields.map(&:to_s).include?(field_name.to_s) ? field_name.to_s : nil
      end

      return nil unless Habarico::ReflectionHelper.is_active_record_class?(@model)

      # A standard DB column or a standard attribute of the model sorts under its own name.
      Habarico::AttributesHelper.generate_attr_variants(@model, field_name).each do |field_name_variant|
        if @model.columns_hash[field_name_variant.to_s] || @model.attribute_names.include?(field_name_variant.to_s)
          return field_name_variant.to_s
        end
      end

      # A range attribute sorts by its lower bound, as long as that one is a DB column.
      if @model.respond_to?(:has_range_attr?) && @model.has_range_attr?(attr_name)
        lower_attr_name = @model.find_range_attr(attr_name)[:lower_attr_name]
        return lower_attr_name if @model.columns_hash[lower_attr_name.to_s]
      end

      # Everything else is not sortable by default. To sort by a "belongs to" association, declare
      # `sort_by` on the field descriptor.
      nil
    end

    # `sort_by` of a field descriptor of a view (`FieldDescriptorGenerator`): a column of an
    # association, addressed as `association__column` the way `order_2` expects it, or whatever the
    # FieldReference declares for itself.
    def descriptor_sort_by(field_reference)
      name = field_reference.name.to_s
      return name if association_column_path?(name)

      field_reference.sort_by
    end

    private

    # Whether `name` is `association__column` - one ActiveRecord association hop to a column, the
    # depth `order_2` sorts by.
    def association_column_path?(name)
      return false unless Habarico::ReflectionHelper.is_active_record_class?(@model)

      hops = name.split(Habarico::FieldPathResolver::RELATION_SEPARATOR)
      return false unless hops.size == 2 && @model.reflect_on_association(hops.first.to_sym)

      Habarico::FieldPathResolver.new(@model).resolve(name)&.column.present?
    end
  end
end
