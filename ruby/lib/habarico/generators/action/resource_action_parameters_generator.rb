module Habarico
  class ResourceActionParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)
      raise Eluvia::Errors::StandardError.new('Argument `action` must be of :resource type') unless action.type.to_sym == :resource

      # Create model
      Habarico::ResourceActionParameters.new(
        is_background: generate_is_background(action, context),
        data: generate_data(action, context),
        endpoint: generate_endpoint(action, context)
      )
    end

    protected

    def resource_action_endpoint_parameters_generator
      @resource_action_endpoint_parameters_generator ||= definition.resource_action_endpoint_parameters_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_is_background(action, _context)
      action.is_background
    end

    def generate_data(action, context)
      Habarico::CallableHelper.resolve(action.data, context)
    end

    def generate_endpoint(action, context)
      resource_action_endpoint_parameters_generator.generate(action, context)
    end

  end
end
