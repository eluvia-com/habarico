module Habarico
  module AttributesHelper

    # Extracts the underlying attribute name from a field entry as it may appear in `fields` /
    # `read_only_fields`: a Symbol/String, a Hash (`{ name => subfields }`) or a FieldReference.
    def self.field_name(field)
      case field
      when Habarico::FieldReference then field.name.to_s
      when ::Hash then field.keys.first.to_s
      else field.to_s
      end
    end

    # FieldSchema attributes a FieldReference (used in `fields` / `read_only_fields`) may override.
    FIELD_REFERENCE_OVERRIDES = %i[format label short_label help_text read_only write_only sortable sort_by default_value].freeze

    # Applies a FieldReference's explicitly set attributes onto a generated FieldSchema, overriding
    # the model-derived defaults. A `nil` FieldReference (Symbol/String/Hash field) is a no-op.
    def self.apply_field_reference_overrides(schema, field_reference)
      return schema if field_reference.nil?

      FIELD_REFERENCE_OVERRIDES.each do |attr|
        value = field_reference.public_send(attr)
        schema.public_send("#{attr}=", value) unless value.nil?
      end
      schema
    end

    def self.is_amount_major_attr?(model, attr_name)
      attr_name.to_s.end_with?('_major') && model.respond_to?(:has_amount_attr?) && model.has_amount_attr?(attr_name.to_s.sub(/_major\z/, ''))
    end

    def self.is_amount_minor_attr?(model, attr_name)
      attr_name.to_s.end_with?('_minor') && model.respond_to?(:has_amount_attr?) && model.has_amount_attr?(attr_name.to_s.sub(/_minor\z/, ''))
    end

    def self.is_enum_obj_attr?(model, attr_name)
      attr_name.to_s.end_with?('_obj') && model.respond_to?(:has_enum_attr?) && model.has_enum_attr?(attr_name.to_s.sub(/_obj\z/, ''))
    end

    def self.generate_attr_variants(model, attr_name)
      attr_name = attr_name.to_s

      # Amount
      if is_amount_major_attr?(model, attr_name)
        return [attr_name.sub(/_major\z/, ''), attr_name, attr_name.sub(/_major\z/, '_minor')]
      end
      if is_amount_minor_attr?(model, attr_name)
        return [attr_name.sub(/_minor\z/, ''), attr_name, attr_name.sub(/_minor\z/, '_major')]
      end
      if model.respond_to?(:has_amount_attr?) && model.has_amount_attr?(attr_name)
        return [attr_name, "#{attr_name}_major", "#{attr_name}_minor"]
      end

      # Enum
      if is_enum_obj_attr?(model, attr_name)
        return [attr_name.sub(/_obj\z/, ''), attr_name]
      end
      if model.respond_to?(:has_enum_attr?) && model.has_enum_attr?(attr_name)
        return [attr_name, "#{attr_name}_obj"]
      end

      [attr_name]
    end

  end
end
