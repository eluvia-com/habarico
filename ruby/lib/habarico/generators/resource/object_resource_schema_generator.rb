module Habarico
  class ObjectResourceSchemaGenerator < ResourceSchemaGenerator

    def generate(view_type, context)
      Habarico::ObjectResourceSchema.new(
        name: generate_name,
        label: generate_label,
        pk_field_name: generate_pk_field_name,
        actions: generate_actions(view_type, context),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_actions(_view_type, context)
      action_schemas = definition.normalized_actions.select do |action|

        # Action must be allowed by permissions
        context.can?(action.permission)

      end.select do |action|

        # Conditional display check
        if action.if.respond_to?(:call)
          action.if.call(context)
        else
          true
        end

      end.map do |action|

        # Generate action schema
        resource_action_schema_generator.generate(action, context)

      end

      # Object-level meta always represents detail semantics, regardless of which endpoint
      # (list or detail) is rendering it, so that a record's action list is identical no
      # matter which response it came from. Only record-bound actions belong here; actions
      # that aren't tied to a specific record (e.g. create) are excluded via is_detail.
      action_schemas.select(&:is_detail)
    end

  end
end
