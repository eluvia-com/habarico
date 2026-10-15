module Habarico
  class FieldDescriptorGenerator < AbstractGenerator

    def generate(model, field_reference, context, force_params = {})
      # Fallback to a simple FieldReference object if a string or a symbol is provided
      field_reference = Habarico::FieldReference.new(name: field_reference.to_s) if field_reference.is_a?(String) || field_reference.is_a?(Symbol)

      # Validate argument
      raise Eluvia::Errors::StandardError.new('Argument `field_reference` must be a Habarico::FieldReference') unless field_reference.is_a?(Habarico::FieldReference)

      # Force parameters
      field_reference.assign(force_params)

      # Create model
      Habarico::FieldDescriptor.new(
        type: 'field',
        name: generate_name(model, field_reference, context),
        label: generate_label(model, field_reference, context),
        short_label: generate_short_label(model, field_reference, context),
        help_text: generate_help_text(model, field_reference, context),
        sortable: generate_sortable(model, field_reference, context),
        sort_by: generate_sort_by(model, field_reference, context),
        read_only: generate_read_only(model, field_reference, context),
        write_only: generate_write_only(model, field_reference, context),
        default_value: generate_default_value(model, field_reference, context),
        action: generate_action(model, field_reference, context),
        wrapper: generate_wrapper(model, field_reference, context),
        options: generate_options(model, field_reference, context)
      )
    end

    protected

    def field_options_generator
      @field_options_generator ||= definition.field_options_generator.new(definition, resource_path)
    end

    def action_descriptor_generator
      @action_descriptor_generator ||= definition.action_descriptor_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(_model, field_reference, _context)
      field_reference.name
    end

    def generate_label(model, field_reference, _context)
      return field_reference.label if field_reference.label.present?
      Habarico::AttributesHelper.generate_attr_variants(model, field_reference.name).each do |attr_name_variant|
        label = I18n.t("#{model.i18n_scope}.attributes.#{model.model_name.i18n_key}.#{attr_name_variant}", default: nil)
        return label if label.present?
      end
      nil # In this case do not define label and use the default one from field schema
    end

    def generate_short_label(_model, field_reference, _context)
      field_reference.short_label
    end

    def generate_help_text(_model, field_reference, _context)
      field_reference.help_text
    end

    def generate_sortable(model, field_reference, context)
      if generate_sort_by(model, field_reference, context).present?
        return true
      end

      field_reference.sortable
    end

    def generate_sort_by(model, field_reference, _context)
      Habarico::SortingHelper.descriptor_sort_by(model, field_reference)
    end

    def generate_read_only(_model, field_reference, _context)
      field_reference.read_only
    end

    def generate_write_only(_model, field_reference, _context)
      field_reference.write_only
    end

    def generate_default_value(_model, field_reference, _context)
      field_reference.default_value
    end

    def generate_action(_model, field_reference, context)
      return nil unless field_reference.action.present?
      action_descriptor_generator.generate(field_reference.action, context)
    end

    def generate_wrapper(_model, field_reference, _context)
      return nil unless field_reference.wrapper.present?
      raise Eluvia::Errors::StandardError.new('`wrapper` must be a Habarico::FieldWrapperProperties') unless field_reference.wrapper.is_a?(Habarico::FieldWrapperProperties)
      field_reference.wrapper
    end

    def generate_options(model, field_reference, _context)
      field_options_generator.generate(model, nil, field_reference)
    end

  end
end
