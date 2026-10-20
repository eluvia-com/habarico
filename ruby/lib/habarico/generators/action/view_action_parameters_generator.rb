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

    # What the view's endpoint addresses, left unaddressed when the action points at nothing of its
    # own. `action_name` lives inside the address, so an action that has one names the resource it
    # belongs to - the same rule the resource action endpoint follows.
    def view_action_endpoint_reference(action, _context)
      action_name = target_view_action_name(action)
      reference = action.endpoint_reference
      reference = resource_name if reference.blank? && action_name.present?
      return nil if reference.blank?

      Habarico::ResourceReference.build(reference, action_name: action_name)
    end

    # The action segment is the *target view's*, not the action's own name: a reserved view
    # (`list` / `create` / `edit` / `show`) is addressed by its type and has none, so an action
    # opening one carries no address at all.
    def target_view_action_name(action)
      return action.endpoint_action_name if action.endpoint_action_name.present?

      definition.normalized_views.find { |view| view.name == action.view_name }&.endpoint_action_name
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
      view_action_endpoint_reference(action, context)
    end

    def generate_keep_linked_parent(action, _context)
      action.view_keep_linked_parent
    end

  end
end
