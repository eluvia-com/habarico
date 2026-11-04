module Habarico
  # Builds the `Habarico::ActionSchema` of a trigger action - the follow-up action the frontend
  # runs after a custom action's response, or the one attached to a serialized record.
  class TriggerActionSchemaGenerator < AbstractGenerator

    # `action` is the name of an action declared in `actions`, a `Habarico::Action` or a ready
    # `Habarico::ActionSchema`, which is returned as is. `record_pk` and `reference` retarget the
    # action at another record and another resource.
    def generate(action, context, record_pk: nil, reference: nil)
      return nil if action.nil?
      return action if action.is_a?(Habarico::ActionSchema)

      action = find_declared_action!(action) if action.is_a?(::String) || action.is_a?(::Symbol)
      unless action.is_a?(Habarico::Action)
        raise Eluvia::Errors::StandardError.new(
          "Trigger action must be a Habarico::ActionSchema, a Habarico::Action or an action name, got `#{action.class}`."
        )
      end

      action_schema_generator.generate(retarget(action, record_pk || detail_record_pk(action, context), reference), context)
    end

    protected

    def action_schema_generator
      @action_schema_generator ||= definition.action_schema_generator.new(definition, resource_path)
    end

    # A trigger runs outside the page of the record it was raised for, so a detail action names
    # that record explicitly - a schema endpoint leaves it to the page.
    def detail_record_pk(action, context)
      context.record_pk if action.is_detail && action.endpoint_record_pk.blank?
    end

    # Copies the action before setting the target, so a declared action is never mutated.
    def retarget(action, record_pk, reference)
      return action if record_pk.blank? && reference.blank?

      action = action.dup
      action.endpoint_record_pk = record_pk if record_pk.present?
      action.endpoint_reference = reference if reference.present?
      action
    end

    # An unknown name raises, since it is far more likely a typo than a deliberately empty trigger.
    def find_declared_action!(name)
      declared = definition.normalized_actions
      action = declared.find { |declared_action| declared_action.name.to_s == name.to_s }
      return action if action

      raise Eluvia::Errors::StandardError.new(
        "Action `#{name}` is not declared in `actions` of resource `#{resource_path&.last}`. " \
        "Declared actions: #{declared.map(&:name).join(', ').presence || 'none'}."
      )
    end

  end
end
