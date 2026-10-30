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
        choices: generate_choices(action, context),
        reference: generate_reference(action, context),
        keep_linked_parent: generate_keep_linked_parent(action, context)
      )
    end

    protected

    # What the view action addresses, left unaddressed when the action points at nothing of its
    # own. `action_name` and `record_pk` live inside the address, so an action that has either names
    # the resource it belongs to - the same rule the resource action endpoint follows. Only an
    # explicit `endpoint_record_pk` is carried: the record of the request is the one the frontend
    # already renders.
    def view_action_reference(action, _context)
      action_name = target_view_action_name(action)
      record_pk = action.endpoint_record_pk.presence
      reference = action.endpoint_reference
      reference = resource_name if reference.blank? && (action_name.present? || record_pk.present?)
      return nil if reference.blank?

      Habarico::ResourceReference.build(reference, action_name: action_name, record_pk: record_pk)
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

    def generate_choices(action, context)
      Habarico::CallableHelper.resolve(action.view_choices, context)
    end

    def generate_reference(action, context)
      # A standard action of the current resource needs no reference - the frontend opens the view
      # over the record it already has. One that names its own target does: the reference is where
      # the target resource and record are written down.
      return nil if Habarico::ActionHelper.is_standard_action?(action) && !Habarico::ActionHelper.has_explicit_target?(action)
      view_action_reference(action, context)
    end

    def generate_keep_linked_parent(action, _context)
      action.view_keep_linked_parent
    end

  end
end
