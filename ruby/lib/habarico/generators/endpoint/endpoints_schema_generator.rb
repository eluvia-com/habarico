module Habarico
  class EndpointsSchemaGenerator < AbstractGenerator

    def generate(model, read_fields, write_fields, filters, methods)
      # Validate arguments
      validate_fields_argument!('read_fields', read_fields)
      validate_fields_argument!('write_fields', write_fields)
      raise Eluvia::Errors::StandardError.new('Argument `filters` must be an Array of String or Symbol instances') unless filters.is_a?(::Array) && filters.all? { |f| f.is_a?(::String) || f.is_a?(::Symbol) }
      raise Eluvia::Errors::StandardError.new('Argument `methods` must be an array of String or Symbol instances') unless methods.is_a?(::Array) && methods.all? { |m| m.is_a?(::String) || m.is_a?(::Symbol) }

      # Create model
      Habarico::EndpointsSchema.new(
        get: methods.include?(:get) || methods.include?('get') ? generate_get(model, read_fields, write_fields, filters) : nil,
        post: methods.include?(:post) || methods.include?('post') ? generate_post(model, read_fields, write_fields, filters) : nil,
        put: methods.include?(:put) || methods.include?('put') ? generate_put(model, read_fields, write_fields, filters) : nil,
        patch: methods.include?(:patch) || methods.include?('patch') ? generate_patch(model, read_fields, write_fields, filters) : nil,
        delete: methods.include?(:delete) || methods.include?('delete') ? generate_delete(model, read_fields, write_fields, filters) : nil
      )
    end

    protected

    def validate_fields_argument!(name, fields)
      valid = fields.is_a?(::Array) && fields.all? do |f|
        f.is_a?(::String) || f.is_a?(::Symbol) || f.is_a?(::Hash) || f.is_a?(Habarico::FieldReference)
      end
      return if valid

      raise Eluvia::Errors::StandardError.new("Argument `#{name}` must be an Array of String, Symbol, Hash or Habarico::FieldReference instances")
    end

    def method_schema_generator
      @method_schema_generator ||= definition.method_schema_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_get(model, read_fields, _write_fields, filters)
      method_schema_generator.generate(model, read_fields, filters)
    end

    def generate_post(model, _read_fields, write_fields, _filters)
      method_schema_generator.generate(model, write_fields, [])
    end

    def generate_put(model, _read_fields, write_fields, _filters)
      method_schema_generator.generate(model, write_fields, [])
    end

    def generate_patch(model, _read_fields, write_fields, _filters)
      method_schema_generator.generate(model, write_fields, [])
    end

    def generate_delete(model, _read_fields, _write_fields, _filters)
      method_schema_generator.generate(model, [], [])
    end

  end
end
