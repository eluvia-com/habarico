module Habarico
  class TabBoxParametersGenerator < AbstractGenerator

    def generate(box, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::TabBox') unless box.is_a?(Habarico::TabBox)

      # Create model
      Habarico::TabBoxParameters.new(
        show_toolbar_navigation: generate_show_toolbar_navigation(box, context),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    # Defaults to false for tab boxes.
    def generate_show_toolbar_navigation(box, _context)
      box.show_toolbar_navigation.nil? ? false : !!box.show_toolbar_navigation
    end

  end
end
