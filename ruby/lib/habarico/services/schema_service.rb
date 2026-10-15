module Habarico
  class SchemaService
    include Singleton

    def initialize
      @global_resource_schema_generators = {}
      @local_resource_schema_generators = {}
      @action_resource_schema_generators = {}
      @object_resource_schema_generators = {}
    end

    def get_global_schema(context)
      raise Eluvia::Errors::StandardError.new('Argument `context` must be a Habarico::Context') unless context.is_a?(Habarico::Context)
      Habarico::ResourceService.instance.get_resources_paths.map do |resource_path|
        global_resource_schema_generator(resource_path).generate(enrich_context_with_definition(resource_path, context))
      end
    end

    def get_local_schema(resource_name, context)
      raise Eluvia::Errors::StandardError.new('Argument `context` must be a Habarico::Context') unless context.is_a?(Habarico::Context)
      resource_path = Habarico::ResourceService.instance.get_resource_path(resource_name)
      return nil unless resource_path
      local_resource_schema_generator(resource_path).generate(enrich_context_with_definition(resource_path, context))
    end

    def get_action_schema(resource_name, action_name, context)
      raise Eluvia::Errors::StandardError.new('Argument `context` must be a Habarico::Context') unless context.is_a?(Habarico::Context)
      resource_path = Habarico::ResourceService.instance.get_resource_path(resource_name)
      return nil unless resource_path
      action_resource_schema_generator(resource_path).generate(action_name, enrich_context_with_definition(resource_path, context))
    end

    def get_object_schema(resource_name, view_type, context)
      raise Eluvia::Errors::StandardError.new('Argument `context` must be a Habarico::Context') unless context.is_a?(Habarico::Context)
      resource_path = Habarico::ResourceService.instance.get_resource_path(resource_name)
      return nil unless resource_path
      object_resource_schema_generator(resource_path).generate(view_type, enrich_context_with_definition(resource_path, context))
    end

    private

    def enrich_context_with_definition(resource_path, context)
      definition = Habarico::ResourceService.instance.get_definition(resource_path)
      if definition != context.definition
        context.reset # to remove all cached values from previous definition
        context.definition = definition
      end
      context
    end

    def global_resource_schema_generator(resource_path)
      definition = Habarico::ResourceService.instance.get_definition(resource_path)
      @global_resource_schema_generators[resource_path.join('.')] ||= definition.global_resource_schema_generator.new(definition, resource_path)
    end

    def local_resource_schema_generator(resource_path)
      definition = Habarico::ResourceService.instance.get_definition(resource_path)
      @local_resource_schema_generators[resource_path.join('.')] ||= definition.local_resource_schema_generator.new(definition, resource_path)
    end

    def action_resource_schema_generator(resource_path)
      definition = Habarico::ResourceService.instance.get_definition(resource_path)
      @action_resource_schema_generators[resource_path.join('.')] ||= definition.action_resource_schema_generator.new(definition, resource_path)
    end

    def object_resource_schema_generator(resource_path)
      definition = Habarico::ResourceService.instance.get_definition(resource_path)
      @object_resource_schema_generators[resource_path.join('.')] ||= definition.object_resource_schema_generator.new(definition, resource_path)
    end

  end
end
