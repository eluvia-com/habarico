module Habarico
  class WizardBoxParametersGenerator < AbstractGenerator

    def generate(box, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::WizardBox') unless box.is_a?(Habarico::WizardBox)

      # Create model
      Habarico::WizardBoxParameters.new(
        show_toolbar_navigation: generate_show_toolbar_navigation(box, context),
        validate_steps: generate_validate_steps(box, context),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    # Defaults to true for wizard boxes.
    def generate_show_toolbar_navigation(box, _context)
      box.show_toolbar_navigation.nil? || !!box.show_toolbar_navigation
    end

    # Defaults to true.
    def generate_validate_steps(box, _context)
      box.validate_steps.nil? || !!box.validate_steps
    end

  end
end
