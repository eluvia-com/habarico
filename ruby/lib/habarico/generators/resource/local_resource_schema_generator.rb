module Habarico
  class LocalResourceSchemaGenerator < ResourceSchemaGenerator

    def generate(context)
      actions, actions_endpoint_parameters = generate_actions(context)
      views, views_endpoint_parameters = generate_views(context)
      Habarico::LocalResourceSchema.new(
        name: generate_name,
        label: generate_label,
        pk_field_name: generate_pk_field_name,
        actions: actions,
        views: views,
        endpoints: generate_endpoints(context, actions_endpoint_parameters + views_endpoint_parameters)
      )
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

    def generate_actions(context)
      is_detail = !context.record_pk.blank?

      # Generate and filter actions based on permissions and whether we are generating for detail or list
      action_schemas = definition.normalized_actions.select do |action|

        # Action must be allowed by permissions
        context.can?(action.permission)

      end.map do |action|

        # Generate action schema
        resource_action_schema_generator.generate(action, context)

      end.select do |action_schema|

        # Plausibility check, only actions that are shown in the current context should be included here
        (is_detail && action_schema.show_in_detail) || # we generate record/detail schema and action should be shown in detail
          (!is_detail && action_schema.show_in_list && !action_schema.is_detail) # we generate resource/list schema and action should be shown in list and does not require record PK

      end

      # Extract endpoint parameters from actions
      endpoint_parameters = action_schemas.map { |action_schema| action_schema&.resource&.endpoint }.compact

      [action_schemas, endpoint_parameters]
    end

    def generate_views(context)
      is_detail = !context.record_pk.blank?

      # Generate and filter views based on permissions and whether we are generating for detail or list
      view_schemas = definition.normalized_views.select do |view|

        # View must be allowed by permissions, only exception is the show view in order to support references across
        # multiple services.
        (view.name.to_s == 'show' && is_detail) || context.can?(view.permission)

      end.map do |view|

        # Generate view schema
        view_schema_generator.generate(view, context)

      end.select do |view_schema|

        # Plausibility check, only views that are shown in the current context should be included here
        view_schema.is_detail == is_detail

      end

      # Extract endpoint parameters from views
      endpoint_parameters = view_schemas.map { |view_schema| view_schema&.endpoint }.compact

      [view_schemas, endpoint_parameters]
    end

    def generate_endpoints(_context, endpoint_parameters)
      # Determine endpoint methods to be included from the endpoint parameters of the actions and views that address
      # the resource itself (no reference; an action name always comes with one). Additionally, always include GET.
      methods = endpoint_parameters.select { |e| e.reference.blank? }.map { |e| e.method.to_sym }
      methods << :get # Ensure GET is always present
      methods = methods.uniq

      # Determine read and write fields
      read_fields = (definition.fields + definition.read_only_fields).uniq
      write_fields = (definition.fields + definition.write_only_fields).uniq

      # Generate endpoint schema
      endpoints_schema_generator.generate(definition.model,
                                         read_fields,
                                         write_fields,
                                         definition.filters,
                                         methods)
    end

  end
end
