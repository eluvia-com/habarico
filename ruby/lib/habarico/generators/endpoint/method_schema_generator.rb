module Habarico
  class MethodSchemaGenerator < AbstractGenerator

    def generate(model, fields, filters)
      Habarico::MethodSchema.new(
        fields: generate_fields(model, fields, filters),
        filters: generate_filters(model, fields, filters)
      )
    end

    protected

    def fields_schema_generator
      @fields_schema_generator ||= definition.fields_schema_generator.new(definition, resource_path)
    end

    def filters_schema_generator
      @filters_schema_generator ||= definition.filters_schema_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_fields(model, fields, _filters)
      fields_schema_generator.generate(model, fields)
    end

    def generate_filters(model, _fields, filters)
      filters_schema_generator.generate(model, filters)
    end

  end
end
