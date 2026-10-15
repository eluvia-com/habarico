module Habarico
  class FieldsSchemaGenerator < AbstractGenerator

    def generate(model, fields)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `fields` must be an Array of String, Symbol, Hash or Habarico::FieldReference instances') unless fields.is_a?(::Array) && fields.all? { |f| f.is_a?(::String) || f.is_a?(::Symbol) || f.is_a?(::Hash) || f.is_a?(Habarico::FieldReference) }

      # Generate result
      fields.map do |field|
        field_reference = nil
        if field.is_a?(::Symbol) || field.is_a?(::String)
          field_name = field.to_s
          subfields = []
        elsif field.is_a?(Habarico::FieldReference)
          field_name = field.name.to_s
          subfields = []
          field_reference = field # its set attributes (format, label, sortable, ...) override the model-derived ones
        elsif field.is_a?(::Hash)
          field_name = field.keys.first.to_s
          subfields = field.values.first # We assume that this is also an array of strings / symbols / hashes, if not, the recursive call will catch it
        else
          next nil
        end
        field_schema_generator.generate(model, field_name, subfields: subfields, field_reference: field_reference)
      end.compact
    end

    protected

    def field_schema_generator
      @field_schema_generator ||= definition.field_schema_generator.new(definition, resource_path)
    end

  end
end
