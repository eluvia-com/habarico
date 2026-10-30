module Habarico
  class ActionDescriptorGenerator < AbstractGenerator

    # `list_source` is the address of the resource a surrounding box lists, which only that box
    # knows - it is what `ResourceReference::LIST` resolves to.
    def generate(action_reference, context, list_source: nil)
      # Fallback to a simple ActionReference object if a string or symbol is provided
      action_reference = Habarico::ActionReference.new(name: action_reference.to_s) if action_reference.is_a?(String) || action_reference.is_a?(Symbol)

      # A group of defaults names no action, so none of the checks below apply to it
      return generate_default_actions(action_reference, list_source) if action_reference.is_a?(Habarico::DefaultActionsReference)

      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action_reference` must be a Habarico::ActionReference') unless action_reference.is_a?(Habarico::ActionReference)

      # Check permission
      if action_reference.permission.present?
        return nil unless context.can?(action_reference.permission)
      end

      # Check "if" condition
      if action_reference.if.present?
        return nil unless Habarico::CallableHelper.resolve(action_reference.if, context)
      end

      # Create model
      Habarico::ActionDescriptor.new(
        name: generate_name(action_reference, context),
        label: generate_label(action_reference, context),
        icon: generate_icon(action_reference, context),
        color: generate_color(action_reference, context),
        action: generate_action(action_reference, context),
        reference: resolve_reference(action_reference.reference, context, list_source),
        confirm_dialog: generate_confirm_dialog(action_reference, context),
        view: generate_view(action_reference, context),
        menu_items: generate_menu_items(action_reference, context),
      )
    end

    protected

    def confirm_dialog_properties_generator
      @confirm_dialog_properties_generator ||= definition.confirm_dialog_properties_generator.new(definition, resource_path)
    end

    def generate_default_actions(action_reference, list_source)
      Habarico::DefaultActionsDescriptor.new(
        reference: resolve_reference(action_reference.reference, nil, list_source),
        scope: action_reference.scope,
      )
    end

    # The address a descriptor binds to: a name as written, or what a sentinel stands for.
    #
    # `CURRENT` is the resource the schema is being generated for, narrowed to the record when the
    # request has one. `LIST` is the collection the surrounding box lists, which the box passes in.
    def resolve_reference(reference, context, list_source)
      case reference
      when nil then nil
      when Habarico::ResourceReference then reference
      when Habarico::ResourceReference::CURRENT
        Habarico::ResourceReference.build(resource_name, record_pk: context&.record_pk)
      when Habarico::ResourceReference::LIST
        raise Eluvia::Errors::StandardError.new('`ResourceReference::LIST` is stamped by the box that lists a resource, so this reference is not inside a list or gallery box') if list_source.nil?
        list_source
      else Habarico::ResourceReference.build(reference)
      end
    end

    def action_schema_generator
      @action_schema_generator ||= definition.action_schema_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(action_reference, _context)
      action_reference.name
    end

    def generate_label(action_reference, _context)
      action_reference.label
    end

    def generate_icon(action_reference, _context)
      action_reference.icon
    end

    def generate_color(action_reference, _context)
      action_reference.color
    end

    def generate_confirm_dialog(action_reference, context)
      return nil if action_reference.confirm_dialog_title.blank? && action_reference.confirm_dialog_message.blank?
      raise Eluvia::Errors::StandardError.new('A confirm dialog needs both a title and a message, or neither') if action_reference.confirm_dialog_title.blank? || action_reference.confirm_dialog_message.blank?
      confirm_dialog_properties_generator.generate(action_reference, context)
    end

    def generate_action(action_reference, context)
      if action_reference.action.present?
        return action_schema_generator.generate(action_reference.action, context)
      end
      nil
    end

    def generate_view(action_reference, _context)
      has_view_params = action_reference.view_mode.present? ||
                        action_reference.view_choices.present? ||
                        action_reference.view_parameters.present? ||
                        !action_reference.view_keep_linked_parent.nil?
      return nil unless has_view_params
      Habarico::ViewActionDescriptorParameters.new(
        mode: action_reference.view_mode,
        choices: action_reference.view_choices,
        parameters: action_reference.view_parameters,
        keep_linked_parent: action_reference.view_keep_linked_parent,
      )
    end

    def generate_menu_items(action_reference, context)
      return nil unless action_reference.menu_items.present?
      action_reference.menu_items.map do |item|
        generate(item, context)
      end.compact
    end

  end
end
