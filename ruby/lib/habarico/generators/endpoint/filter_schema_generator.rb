module Habarico
  class FilterSchemaGenerator < AbstractGenerator

    def generate(model, filter_name)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `model` must be an Eluvia::ActiveRecord::Filtering subclass') unless model.ancestors.include?(Eluvia::ActiveRecord::Filtering)
      raise Eluvia::Errors::StandardError.new("Filter `#{filter_name}` not found on model `#{model}`") unless model.filter_params[filter_name.to_sym]
      filter_param = model.filter_params[filter_name.to_sym]

      # Create model
      Habarico::FilterSchema.new(
        name: generate_name(model, filter_name, filter_param),
        type: generate_type(model, filter_name, filter_param),
        format: generate_format(model, filter_name, filter_param),
        label: generate_label(model, filter_name, filter_param),
        help_text: generate_help_text(model, filter_name, filter_param),
        reference: generate_reference(model, filter_name, filter_param),
        enum: generate_enum(model, filter_name, filter_param),
        items: generate_items(model, filter_name, filter_param),
        properties: generate_properties(model, filter_name, filter_param),
        options: generate_options(model, filter_name, filter_param)
      )
    end

    protected

    # ***********************************************************************
    # Schema generators
    # ***********************************************************************

    def enum_type_generator
      @enum_type_generator ||= definition.enum_type_generator.new(definition, resource_path)
    end

    def field_schema_generator
      @field_schema_generator ||= definition.field_schema_generator.new(definition, resource_path)
    end

    def field_options_generator
      @field_options_generator ||= definition.field_options_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(_model, filter_name, _filter_param)
      filter_name
    end

    def map_type(type)
      case type
      when :integer then 'integer'
      when :boolean then 'boolean'
      when :float, :decimal then 'number'
      when :datetime then 'string'
      when :date then 'string'
      when :text then 'string'
      when :uuid then 'string'
      else 'string'
      end
    end

    def generate_type(_model, _filter_name, filter_param)
      type = filter_param[:type]

      # Special types and annotations
      return 'object' if type == :range

      # Basic types
      map_type(type)
    end

    def map_format(type)
      case type
      when :integer then nil
      when :boolean then nil
      when :float, :decimal then nil
      when :datetime then 'date-time'
      when :date then 'date'
      when :time then 'time'
      when :text then 'text'
      when :uuid then 'uuid'
      end
    end

    def generate_format(_model, _filter_name, filter_param)
      type = filter_param[:type]
      attr_name = filter_param[:attr_name]
      filters_model_class = filter_param[:model] # this is not the same as `_model` argument!

      # Special types and annotations
      return 'range' if type == :range
      return 'relation' if type == :has_one
      return 'relation' if filters_model_class.respond_to?(:has_attr?) && filters_model_class.has_attr?(attr_name, type: :has_one)
      return 'choices' if filters_model_class.respond_to?(:has_enum_attr?) && filters_model_class.has_enum_attr?(attr_name)

      # Basic types
      map_format(type)
    end

    def generate_label(_model, _filter_name, filter_param)
      return filter_param[:label] if filter_param.fetch(:label, nil).present?

      attr_name = filter_param[:attr_name]
      filters_model_class = filter_param[:model] # this is not the same as `_model` argument!
      i18n_model_class = resolve_i18n_model_class(filters_model_class)

      Habarico::AttributesHelper.generate_attr_variants(filters_model_class, attr_name).each do |attr_name_variant|
        label = I18n.t("#{i18n_model_class.i18n_scope}.attributes.#{i18n_model_class.model_name.i18n_key}.#{attr_name_variant}", default: nil)
        return label if label.present?
      end
      attr_name.to_s.humanize
    end

    # `filters_model_class` (`filter_param[:model]`) is usually a nested `Eluvia::ActiveRecord::FiltersModel`
    # proxy class (e.g. `Employee::Filters`), not the real AR model — its own i18n_scope/model_name don't match
    # where attribute translations actually live. Resolve back to the real model the same way generate_reference
    # does for class names (strip the `::Filters` suffix), falling back to the proxy class itself if that fails.
    def resolve_i18n_model_class(filters_model_class)
      filters_model_class.name.to_s.delete_suffix('::Filters').constantize
    rescue StandardError
      filters_model_class
    end

    def generate_help_text(_model, _filter_name, _filter_param)
      # not implemented yet
    end

    def generate_reference(_model, _filter_name, filter_param)
      type = filter_param[:type]
      attr_name = filter_param[:attr_name]
      filters_model_class = filter_param[:model] # this is not the same as `_model` argument!

      # Reference derived from filter attribute with type "has_one" on the filters model
      if type == :has_one
        attr = filters_model_class.find_filter_attr(attr_name)
        class_name = attr.fetch(:options, nil)&.fetch(:class_name, nil)
        if class_name
          return Habarico::ResourceService.instance.find_resource_name_by_model_class(class_name.delete_suffix("::Filters").constantize)
        end
      end

      # Reference derived from "has one" attribute on the filters model
      if filters_model_class.respond_to?(:has_attr?) && filters_model_class.has_attr?(attr_name, type: :has_one)
        attr = filters_model_class.find_attr(attr_name, type: :has_one)
        class_name = attr.fetch(:class_name, nil)
        if class_name
          return Habarico::ResourceService.instance.find_resource_name_by_model_class(class_name.delete_suffix("::Filters").constantize)
        end
      end

      nil
    end

    def generate_enum(_model, _filter_name, filter_param)
      attr_name = filter_param[:attr_name]
      filters_model_class = filter_param[:model] # this is not the same as `_model` argument!

      # Generate enum item schema for each choice in enum attribute
      if filters_model_class.respond_to?(:has_enum_attr?) && filters_model_class.has_enum_attr?(attr_name)
        return filters_model_class.find_enum_attr(attr_name).keys.map do |choice|
          enum_type_generator.generate(filters_model_class, attr_name, choice)
        end
      end

      nil
    end

    def generate_items(_model, _filter_name, _filter_param)
      # not implemented yet
    end

    def generate_properties(_model, _filter_name, filter_param)
      attr_name = filter_param[:attr_name]
      filters_model_class = filter_param[:model] # this is not the same as `_model` argument!

      # Object attribute is just a collection of attributes existing on the same model. In this case it's
      # usually a range attribute which is defined as a special case of object.
      if filters_model_class.respond_to?(:has_object_attr?) && filters_model_class.has_object_attr?(attr_name)
        result = []
        object_attr = filters_model_class.find_object_attr(attr_name)
        object_attr[:fields].each do |field|
          key = field.keys.first
          underlying_attr_name = field.values.first
          result << field_schema_generator.generate(filters_model_class, underlying_attr_name, force_name: key)
        end
        return result
      end

      nil
    end

    def generate_options(_model, _filter_name, filter_param)
      attr_name = filter_param[:attr_name]
      filters_model_class = filter_param[:model] # this is not the same as `_model` argument!
      field_options_generator.generate(filters_model_class, attr_name, nil)
    end

  end
end
