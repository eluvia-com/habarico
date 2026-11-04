module Habarico
  class FieldSchemaGenerator < AbstractGenerator

    def generate(model, field_name, subfields: [], force_name: nil, field_reference: nil)
      # Recognise field variant (active model or active record) and validate arguments
      if Habarico::ReflectionHelper.is_attributes_model_class?(model) && model.has_simple_attr?(field_name) # simple attribute on attributes model
        variant = :attributes_model
        attr_name = field_name
      elsif Habarico::ReflectionHelper.is_attributes_model_class?(model) && model.has_complex_attr?(field_name) # complex attribute on attributes model
        variant = :attributes_model
        attr_name = field_name
      elsif Habarico::ReflectionHelper.is_active_record_class?(model) && model.columns_hash[field_name.to_s] # standard DB column on active record
        variant = :active_record
        attr_name = field_name
      elsif Habarico::ReflectionHelper.is_active_record_class?(model) && model.attribute_names.include?(field_name.to_s) # virtual attribute (attribute :x) - not a DB column
        variant = :active_model
        attr_name = field_name
      elsif Habarico::ReflectionHelper.is_active_model_class?(model) && model.attribute_names.include?(field_name.to_s) # standard attribute accessor on active model
        variant = :active_model
        attr_name = field_name
      elsif Habarico::ReflectionHelper.is_belongs_to_association?(model, field_name) # belongs to association on active record
        variant = :active_record
        attr_name = model.reflect_on_association(field_name.to_sym).foreign_key
      elsif Habarico::ReflectionHelper.is_has_one_association?(model, field_name) # has one association on active record
        variant = :attributes_model # foreign key is on the other model and must be delegated to this model via a simple attribute, so we treat it as active model attribute
        attr_name = model.reflect_on_association(field_name.to_sym).foreign_key
        unless Habarico::ReflectionHelper.is_attributes_model_class?(model) && model.has_simple_attr?(attr_name)
          raise Eluvia::Errors::StandardError.new("Argument `model` must be an ActiveRecord::Base and Eluvia::ActiveModel::Attributes subclass and attribute `#{attr_name}` must exist on the model")
        end
      else
        raise Eluvia::Errors::StandardError.new("Argument `model` must be an ActiveRecord::Base or Eluvia::ActiveModel::Attributes subclass and field or attribute `#{field_name}` must exist on the model")
      end

      # Create model
      schema = Habarico::FieldSchema.new(
        name: generate_name(model, field_name, attr_name, variant, force_name),
        type: generate_type(model, field_name, attr_name, variant),
        format: generate_format(model, field_name, attr_name, variant),
        label: generate_label(model, field_name, attr_name, variant),
        help_text: generate_help_text(model, field_name, attr_name, variant),
        read_only: generate_read_only(model, field_name, attr_name, variant),
        write_only: generate_write_only(model, field_name, attr_name, variant),
        nullable: generate_nullable(model, field_name, attr_name, variant),
        required: generate_required(model, field_name, attr_name, variant),
        sortable: generate_sortable(model, field_name, attr_name, variant),
        sort_by: generate_sort_by(model, field_name, attr_name, variant),
        reference: Habarico::ResourceReference.build(generate_reference(model, field_name, attr_name, variant)),
        enum: generate_enum(model, field_name, attr_name, variant),
        items: generate_items(model, field_name, attr_name, variant, subfields, field_reference: field_reference),
        properties: generate_properties(model, field_name, attr_name, variant, subfields),
        options: generate_options(model, field_name, attr_name, variant),
      )

      Habarico::AttributesHelper.apply_field_reference_overrides(schema, field_reference)
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

    def fields_schema_generator
      @fields_schema_generator ||= definition.fields_schema_generator.new(definition, resource_path)
    end

    def field_options_generator
      @field_options_generator ||= definition.field_options_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(_model, field_name, _attr_name, _variant, force_name)
      force_name || field_name
    end

    def map_active_record_type(type)
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

    def map_attributes_model_type(type)
      case type
      when :integer then 'integer'
      when :boolean then 'boolean'
      when :float then 'number'
      when :datetime then 'string'
      when :date then 'string'
      when :string then 'string'
      when :uuid then 'string'
      else 'string'
      end
    end

    def map_active_model_type(type)
      case type
      when 'ActiveModel::Type::Integer' then 'integer'
      when 'ActiveModel::Type::String' then 'string'
      else 'string'
      end
    end

    def generate_type(model, _field_name, attr_name, variant)
      # Special types and annotations
      return 'object' if model.respond_to?(:has_attr?) && model.has_attr?(attr_name, type: :has_one)
      return 'object' if model.respond_to?(:has_object_attr?) && model.has_object_attr?(attr_name)
      return 'array' if model.respond_to?(:has_attr?) && model.has_attr?(attr_name, type: :has_many)
      return 'array' if model.respond_to?(:has_array_attr?) && model.has_array_attr?(attr_name)
      return 'string' if model.respond_to?(:has_enum_attr?) && model.has_enum_attr?(attr_name)

      # Basic types are computed specific for active model and active record variants
      if variant == :attributes_model
        attr = model.find_simple_attr(attr_name)
        return map_attributes_model_type(attr[:type]) if attr
      end
      if variant == :active_record
        type = model.columns_hash[attr_name.to_s].type
        return map_active_record_type(type)
      end
      if variant == :active_model
        type = model.attribute_types[attr_name.to_s].class.to_s
        return map_active_model_type(type)
      end

      'string'
    end

    def map_active_record_format(type)
      case type
      when :datetime then 'date-time'
      when :date then 'date'
      when :time then 'time'
      when :text then 'text'
      when :uuid then 'uuid'
      end
    end

    def map_attributes_model_format(type)
      case type
      when :datetime then 'date-time'
      when :date then 'date'
      when :uuid then 'uuid'
      end
    end

    def generate_format(model, field_name, attr_name, variant)
      # Special types and annotations
      if model.respond_to?(:has_file_attr?) && model.has_file_attr?(attr_name)
        if model.find_file_attr(attr_name).fetch(:nature) == :image
          return 'base64-image'
        else
          return 'base64-file'
        end
      end
      return 'range' if model.respond_to?(:has_range_attr?) && model.has_range_attr?(attr_name)
      return nil if model.respond_to?(:has_array_attr?) && model.has_array_attr?(attr_name)
      return nil if model.respond_to?(:has_object_attr?) && model.has_object_attr?(attr_name)
      return 'relation' if Habarico::ReflectionHelper.is_has_one_reference?(model, field_name)
      return 'relation' if Habarico::ReflectionHelper.is_belongs_to_association?(model, field_name)
      return 'relation' if Habarico::ReflectionHelper.is_has_one_association?(model, field_name)
      return 'choices' if model.respond_to?(:has_enum_attr?) && model.has_enum_attr?(attr_name)

      # Basic types are computed specific for active model and active record variants
      if variant == :attributes_model
        attr = model.find_simple_attr(attr_name)
        return map_attributes_model_format(attr[:type]) if attr
      end
      if variant == :active_record
        type = model.columns_hash[attr_name.to_s].type
        return map_active_record_format(type)
      end

      nil
    end

    def generate_label(model, field_name, _attr_name, _variant)
      Habarico::AttributesHelper.generate_attr_variants(model, field_name).each do |field_name_variant|
        label = I18n.t("#{model.i18n_scope}.attributes.#{model.model_name.i18n_key}.#{field_name_variant}", default: nil)
        return label if label.present?
      end
      field_name.to_s.humanize
    end

    def generate_help_text(model, field_name, _attr_name, _variant)
      Habarico::AttributesHelper.generate_attr_variants(model, field_name).each do |field_name_variant|
        help_text = I18n.t("#{model.i18n_scope}.attributes.#{model.model_name.i18n_key}.#{field_name_variant}_help_text", default: nil)
        return help_text if help_text.present?
      end
      nil
    end

    def generate_read_only(_model, _field_name, _attr_name, _variant)
      # not implemented yet
    end

    def generate_write_only(_model, _field_name, _attr_name, _variant)
      # not implemented yet
    end

    def generate_nullable(model, _field_name, attr_name, variant)
      # For an attributes model, this is always true as there are no built-in validators
      if variant == :attributes_model
        return true
      end

      # For active record, this is derived from database column nullability
      if variant == :active_record
        return model.columns_hash[attr_name.to_s].null
      end

      # For active model, this is always true as there are no built-in validators
      if variant == :active_model
        return true
      end

      nil
    end

    def generate_required(model, field_name, _attr_name, variant)
      # For an attributes model, this is always false as there are no built-in validators
      if variant == :attributes_model
        return false
      end

      # For active record, this is derived from presence validators
      if variant == :active_record
        model.validators_on(field_name).any? do |v|
          v.is_a?(::ActiveModel::Validations::PresenceValidator)
        end
      end

      # For active model, this is always false as there are no built-in validators
      if variant == :active_model
        return false
      end

      nil
    end

    def generate_sortable(model, field_name, attr_name, variant)
      generate_sort_by(model, field_name, attr_name, variant).present?
    end

    def generate_sort_by(model, field_name, attr_name, _variant)
      Habarico::SortingResolver.new(model, sorting_fields: definition.sorting_fields).field_sort_by(field_name, attr_name: attr_name)
    end

    def generate_reference(model, field_name, _attr_name, _variant)
      # Manually declared "has one" reference
      if Habarico::ReflectionHelper.is_has_one_reference?(model, field_name)
        reference = model.find_reference(field_name)
        reference_class = reference[:class_name].constantize
        if reference_class.const_defined?(:REFERENCE)
          return reference_class.const_get(:REFERENCE)
        end
      end

      # Reference derived from "belongs to" association
      if Habarico::ReflectionHelper.is_belongs_to_association?(model, field_name)
        reflection = model.reflect_on_association(field_name.to_sym)
        if reflection
          return Habarico::ResourceService.instance.find_resource_name_by_model_class(reflection.klass)
        end
      end

      # Reference derived from "has one" association
      if Habarico::ReflectionHelper.is_has_one_association?(model, field_name)
        reflection = model.reflect_on_association(field_name.to_sym)
        if reflection
          return Habarico::ResourceService.instance.find_resource_name_by_model_class(reflection.klass)
        end
      end

      nil
    end

    def generate_enum(model, _field_name, attr_name, _variant)
      if model.respond_to?(:has_enum_attr?) && model.has_enum_attr?(attr_name)
        return model.find_enum_attr(attr_name).keys.map do |choice|
          enum_type_generator.generate(model, attr_name, choice)
        end
      end
      nil
    end

    def generate_items(model, field_name, attr_name, _variant, subfields, field_reference: nil)
      name = ''
      label = generate_label(model, field_name, attr_name, nil)

      # "Append only" file array attribute is a list of uploads, each item a file the frontend uploads
      if Habarico::ReflectionHelper.is_append_only_file_array_attr?(model, attr_name)
        return Habarico::FieldSchema.new(
          name: name,
          label: label,
          type: 'object',
          format: model.find_file_array_attr(attr_name).fetch(:nature) == :image ? 'base64-image' : 'base64-file',
          properties: fields_schema_generator.generate(Eluvia::File, %i[type url filename size content]),
          options: field_options_generator.generate(model, attr_name, field_reference),
        )
      end

      # Manually declared "has many" reference is interpreted as array of relations, so we need to define items schema
      if Habarico::ReflectionHelper.is_has_many_reference?(model, field_name)
        reference = model.find_reference(field_name)
        reference_class = reference[:class_name].constantize
        if reference_class.const_defined?(:REFERENCE)
          return Habarico::FieldSchema.new(
            name: name,
            label: label,
            type: 'string',
            format: 'relation',
            reference: Habarico::ResourceReference.build(reference_class.const_get(:REFERENCE)),
          )
        end
      end

      # "Array" attribute is interpreted as array of simple types, like string, integer, etc.
      if model.respond_to?(:has_array_attr?) && model.has_array_attr?(attr_name)
        array_attr = model.find_array_attr(attr_name)
        return Habarico::FieldSchema.new(
          name: name,
          label: label,
          type: map_attributes_model_type(array_attr[:type]),
          format: map_attributes_model_format(array_attr[:type]),
        )
      end

      # "Has many" attribute is interpreted as array of objects
      if model.respond_to?(:has_attr?) && model.has_attr?(attr_name, type: :has_many)
        array_attr = model.find_attr(attr_name, type: :has_many)
        if array_attr[:class_name]
          return Habarico::FieldSchema.new(
            name: name,
            label: label,
            type: 'object',
            properties: fields_schema_generator.generate(array_attr[:class_name].constantize, subfields)
          )
        end
      end

      nil
    end

    def generate_properties(model, _field_name, attr_name, _variant, subfields)
      # "Object" attribute is just a collection of attributes existing on the same model
      if model.respond_to?(:has_object_attr?) && model.has_object_attr?(attr_name)
        result = []
        object_attr = model.find_object_attr(attr_name)
        object_attr[:fields].each do |field|
          key = field.keys.first
          underlying_attr_name = field.values.first
          result << field_schema_generator.generate(model, underlying_attr_name, force_name: key)
        end
        return result
      end

      # "Has one" attribute is a collection of attributes existing on a different class
      if model.respond_to?(:has_attr?) && model.has_attr?(attr_name, type: :has_one)
        object_attr = model.find_attr(attr_name, type: :has_one)
        if object_attr[:class_name] == 'Eluvia::File'
          return fields_schema_generator.generate(object_attr[:class_name].constantize, %i[type url filename size content])
        else
          return fields_schema_generator.generate(object_attr[:class_name].constantize, subfields)
        end
      end

      nil
    end

    def generate_options(model, _field_name, attr_name, _variant)
      # The upload options of an append-only file array are on its items, where the frontend reads them
      return nil if Habarico::ReflectionHelper.is_append_only_file_array_attr?(model, attr_name)

      field_options_generator.generate(model, attr_name, nil)
    end

  end
end
