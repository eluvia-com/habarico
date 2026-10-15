module Habarico
  class FilterDescriptorGenerator < AbstractGenerator

    def generate(model, filter_reference, context, force_params = {})
      # Fallback to a simple FilterReference object if a string or a symbol is provided
      filter_reference = Habarico::FilterReference.new(name: filter_reference.to_s) if filter_reference.is_a?(String) || filter_reference.is_a?(Symbol)

      # Validate argument
      raise Eluvia::Errors::StandardError.new('Argument `filter_reference` must be a Habarico::FilterReference') unless filter_reference.is_a?(Habarico::FilterReference)

      # Force parameters
      filter_reference.assign(force_params)

      # Create model
      Habarico::FilterDescriptor.new(
        name: generate_name(model, filter_reference, context),
        label: generate_label(model, filter_reference, context),
        help_text: generate_help_text(model, filter_reference, context),
        is_always_on: generate_is_always_on(model, filter_reference, context),
        default_value: generate_default_value(model, filter_reference, context),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(_model, field_reference, _context)
      field_reference.name
    end

    def generate_label(model, field_reference, _context)
      return field_reference.label if field_reference.label.present?

      return nil unless model.respond_to?(:filter_params)
      filter_param = model.filter_params[field_reference.name.to_sym]
      return nil unless filter_param # In this case do not define label and use the default one from filter schema

      attr_name = filter_param[:attr_name]
      filters_model_class = filter_param[:model] # this is not the same as `model` argument!
      i18n_model_class = resolve_i18n_model_class(filters_model_class)

      Habarico::AttributesHelper.generate_attr_variants(filters_model_class, attr_name).each do |attr_name_variant|
        label = I18n.t("#{i18n_model_class.i18n_scope}.attributes.#{i18n_model_class.model_name.i18n_key}.#{attr_name_variant}", default: nil)
        return label if label.present?
      end
      nil # In this case do not define label and use the default one from filter schema
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

    def generate_help_text(_model, field_reference, _context)
      field_reference.help_text
    end

    def generate_is_always_on(_model, field_reference, _context)
      field_reference.is_always_on
    end

    def generate_default_value(_model, field_reference, _context)
      field_reference.default_value
    end

  end
end
