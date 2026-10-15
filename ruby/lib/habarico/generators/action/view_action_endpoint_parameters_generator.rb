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
      action.endpoint_action_name || action.name
    end

    def generate_record_pk(action, context)
      if action&.is_detail
        context.record_pk
      end
    end

  end
end
