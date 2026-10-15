module Habarico
  class SaveActionParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)
      raise Eluvia::Errors::StandardError.new('Argument `action` must be of :save type') unless action.type.to_sym == :save

      # Create model
      Habarico::SaveActionParameters.new(
        data: generate_data(action, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_data(action, context)
      Habarico::CallableHelper.resolve(action.data, context)
    end

  end
end
