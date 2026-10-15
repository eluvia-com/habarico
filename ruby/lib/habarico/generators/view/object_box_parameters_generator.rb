module Habarico
  class ObjectBoxParametersGenerator < AbstractGenerator

    def generate(box, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::ObjectBox') unless box.is_a?(Habarico::ObjectBox)
      raise Eluvia::Errors::StandardError.new('Attribute `target` of the `box` argument must be set') if box.target.blank?

      # Create model
      Habarico::ObjectBoxParameters.new(
        target: generate_target(box, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_target(box, _context)
      box.target
    end

  end
end
