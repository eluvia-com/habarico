module Habarico
  class ViewActionParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)
      raise Eluvia::Errors::StandardError.new('Argument `action` must be of :view type') unless action.type.to_sym == :view

      # Create model
      Habarico::ViewActionParameters.new(
        name: generate_name(action, context),
        mode: generate_mode(action, context),
        dialog_width: generate_dialog_width(action, context),
        parameters: generate_parameters(action, context),
        endpoint: generate_endpoint(action, context),
        keep_linked_parent: generate_keep_linked_parent(action, context)
      )
    end

    protected

    def view_action_endpoint_parameters_generator
      @view_action_endpoint_parameters_generator ||= definition.view_action_endpoint_parameters_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(action, _context)
      action.view_name
    end

    def generate_mode(action, _context)
      action.view_mode
    end

    def generate_dialog_width(action, _context)
      action.dialog_width
    end

    def generate_parameters(action, context)
      Habarico::CallableHelper.resolve(action.view_parameters, context)
    end

    def generate_endpoint(action, context)
      return nil if Habarico::ActionHelper.is_standard_action?(action)
      view_action_endpoint_parameters_generator.generate(action, context)
    end

    def generate_keep_linked_parent(action, _context)
      action.view_keep_linked_parent
    end

  end
end
