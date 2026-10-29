module Habarico
  class SaveActionParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)
      raise Eluvia::Errors::StandardError.new('Argument `action` must be of :save type') unless action.type.to_sym == :save

      # Create model
      Habarico::SaveActionParameters.new(
        data: generate_data(action, context),
        after_save: generate_after_save(action, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_data(action, context)
      Habarico::CallableHelper.resolve(action.data, context)
    end

    def generate_after_save(action, _context)
      action.after_save
    end

  end
end
