module Habarico
  class DetailViewParametersGenerator < AbstractGenerator

    def generate(view, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `view` must be a Habarico::View') unless view.is_a?(Habarico::View)

      # Create model
      Habarico::DetailViewParameters.new(
        box: generate_box(view, context),
        toolbar_actions: generate_toolbar_actions(view, context),
        bottom_actions: generate_bottom_actions(view, context),
      )
    end

    BOTTOM_ACTION_VIEW_TYPES = %i[create edit action].freeze

    protected

    def box_schema_generator
      @box_schema_generator ||= definition.box_schema_generator.new(definition, resource_path)
    end

    def action_descriptor_generator
      @action_descriptor_generator ||= definition.action_descriptor_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_box(view, context)
      box_schema_generator.generate(view, view.box, 0, context)
    end

    def generate_toolbar_actions(view, context)
      unless view.toolbar_actions.nil?
        return view.toolbar_actions.map do |action|
          action_descriptor_generator.generate(action, context)
        end.compact
      end
      nil
    end

    def generate_bottom_actions(view, context)
      if BOTTOM_ACTION_VIEW_TYPES.include?(view.type.to_sym)
        save_reference = Habarico::ActionReference.new(
          name: 'save',
          permission: nil,
          action: Habarico::SaveAction.new
        )
        [action_descriptor_generator.generate(save_reference, context)].compact
      end
    end

  end
end
