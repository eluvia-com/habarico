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
    DEFAULT_BOX_VIEW_TYPES = %i[show create edit].freeze

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
      box_schema_generator.generate(view, view.box || default_box(view), 0, context)
    end

    # A standard view that lays out nothing shows the resource's fields, as the list does.
    def default_box(view)
      return nil if view.boxes.present? || !DEFAULT_BOX_VIEW_TYPES.include?(view.type.to_sym)

      fields = definition.fields + definition.read_only_fields
      fields += definition.write_only_fields unless view.type.to_sym == :show
      # A `{ name => subfields }` entry is laid out as the field `name`.
      fields = fields.map { |field| field.is_a?(::Hash) ? field.keys.first : field }
      Habarico::Box.new(boxes: fields.uniq { |field| field.is_a?(Habarico::FieldReference) ? field.name.to_s : field.to_s })
    end

    # Everything the resource supports, until the view says otherwise. Only a slot the author never
    # mentioned carries the default: `nil` and `[]` are both decisions to render nothing.
    def generate_toolbar_actions(view, context)
      unless view.assigned?(:toolbar_actions)
        return [action_descriptor_generator.generate(Habarico::DefaultActionsReference.new, context)].compact
      end
      return nil if view.toolbar_actions.nil?

      view.toolbar_actions.map do |action|
        action_descriptor_generator.generate(action, context)
      end.compact
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
