module Habarico
  class ActionResourceSchemaGenerator < ResourceSchemaGenerator

    def generate(action_name, context)
      view = definition.normalized_views.find { |view| view.endpoint_action_name == action_name }
      action = definition.normalized_actions.find { |action| action.is_a?(Habarico::ResourceAction) && action.endpoint_action_name == action_name }
      if view
        generate_view_action(action_name, view, context)
      elsif action
        generate_resource_action(action_name, action, context)
      else
        Habarico::LocalResourceSchema.new(
          name: generate_name,
          label: generate_label,
          pk_field_name: generate_pk_field_name
        )
      end
    end

    protected

    def resource_action_schema_generator
      @resource_action_schema_generator ||= definition.resource_action_schema_generator.new(definition, resource_path)
    end

    def view_schema_generator
      @view_schema_generator ||= definition.view_schema_generator.new(definition, resource_path)
    end

    def endpoints_schema_generator
      @endpoints_schema_generator ||= definition.endpoints_schema_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_actions(_action_name, _context)
      []
    end

    def generate_view_action(action_name, view, context)
      # Generate view schema
      view_schema = view_schema_generator.generate(view, context)

      # Generate endpoint schema
      model = view.model || definition.model
      read_fields = write_fields = view.boxes
      endpoints_schema = endpoints_schema_generator.generate(model, read_fields, write_fields, [], [view_schema.endpoint.method.to_sym])

      # Create model
      Habarico::LocalResourceSchema.new(
        name: generate_name,
        label: generate_label,
        pk_field_name: generate_pk_field_name,
        actions: generate_actions(action_name, context),
        views: [view_schema],
        endpoints: endpoints_schema
      )
    end

    def generate_resource_action(action_name, action, context)
      # Generate resource action schema
      resource_action_schema = resource_action_schema_generator.generate(action, context)
      raise Eluvia::Errors::StandardError.new("Action `#{action_name}` must be a resource action") unless resource_action_schema.resource&.endpoint

      # Generate endpoint schema
      endpoints_schema = endpoints_schema_generator.generate(definition.model,
                                                           [], [], [],
                                                           [resource_action_schema.resource.endpoint.method.to_sym])

      # Create model
      Habarico::LocalResourceSchema.new(
        name: generate_name,
        label: generate_label,
        pk_field_name: generate_pk_field_name,
        actions: generate_actions(action_name, context),
        views: [],
        endpoints: endpoints_schema
      )
    end

  end
end
