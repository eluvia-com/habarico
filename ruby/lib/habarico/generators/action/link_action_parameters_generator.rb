module Habarico
  class LinkActionParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)
      raise Eluvia::Errors::StandardError.new('Argument `action` must be of :link type') unless action.type.to_sym == :link

      # Create model
      Habarico::LinkActionParameters.new(
        url: generate_url(action, context),
        target: generate_target(action, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_url(action, context)
      Habarico::CallableHelper.resolve(action.link_url, context)
    end

    def generate_target(action, _context)
      action.link_target
    end

  end
end
