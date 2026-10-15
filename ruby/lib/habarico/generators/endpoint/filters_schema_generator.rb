module Habarico
  class FiltersSchemaGenerator < AbstractGenerator

    def generate(model, filters)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `filters` must be an Array of String or Symbol instances') unless filters.is_a?(::Array) && filters.all? { |f| f.is_a?(::String) || f.is_a?(::Symbol) }

      # Generate result
      result = filters.map { |filter_name| filter_schema_generator.generate(model, filter_name) }.compact
      result << search_filter_schema_generator.generate(model)
      result
    end

    protected

    def filter_schema_generator
      @filter_schema_generator ||= definition.filter_schema_generator.new(definition, resource_path)
    end

    def search_filter_schema_generator
      @search_filter_schema_generator ||= definition.search_filter_schema_generator.new(definition, resource_path)
    end

  end
end
