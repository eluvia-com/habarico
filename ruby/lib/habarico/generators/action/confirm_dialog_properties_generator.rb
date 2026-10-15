module Habarico
  class ConfirmDialogPropertiesGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)

      # Create model
      Habarico::ConfirmDialogProperties.new(
        title: generate_title(action, context),
        message: generate_message(action, context),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_title(action, _context)
      action.confirm_dialog_title
    end

    def generate_message(action, _context)
      action.confirm_dialog_message
    end

  end
end
