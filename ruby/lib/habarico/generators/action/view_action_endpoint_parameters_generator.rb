module Habarico
  class ViewActionEndpointParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)

      # Create model
      Habarico::ViewActionEndpointParameters.new(
        reference: generate_reference(action, context),
        action_name: generate_action_name(action, context),
        record_pk: generate_record_pk(action, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_reference(action, _context)
      action.endpoint_reference
    end

    def generate_action_name(action, _context)
      return action.endpoint_action_name if action.endpoint_action_name.present?
      # A standard action is reached through the resource's standard endpoint, which carries no
      # action name - the frontend derives it from the view alone.
      return nil if Habarico::ActionHelper.is_standard_action?(action)
      action.name
    end

    def generate_record_pk(action, context)
      # An explicit record pk on the action wins over the record in the context: it is how an
      # action targets a record other than the one it was invoked on.
      return action.endpoint_record_pk if action.endpoint_record_pk.present?
      context.record_pk if action&.is_detail
    end

  end
end
