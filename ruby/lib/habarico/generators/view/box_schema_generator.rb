module Habarico
  class BoxSchemaGenerator < AbstractGenerator

    def generate(view, box, index, context)
      # Fallback to an empty box if none is provided
      box = Habarico::Box.new if box.nil?

      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `view` must be a Habarico::View') unless view.is_a?(Habarico::View)
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::Box') unless box.is_a?(Habarico::Box)

      # Deduce reference and target for has_many associations for list boxes
      if box.type == 'list' && !box.reference
        if box.name && Habarico::ReflectionHelper.is_has_many_association?(definition.model, box.name)
          reflection = definition.model.reflect_on_association(box.name.to_sym)
          if reflection
            reference = Habarico::ResourceService.instance.find_resource_name_by_model_class(reflection.klass)
            if reference
              box.reference = reference
              box.target = reflection.foreign_key
            end
          end
        end
      end

      # Create model
      Habarico::BoxSchema.new(
        type: generate_type(view, box, index, context),
        name: generate_name(view, box, index, context),
        label: generate_label(view, box, index, context),
        read_only: generate_read_only(view, box, index, context),
        card: generate_card(view, box, index, context),
        collapsible: generate_collapsible(view, box, index, context),
        toolbar_actions: generate_toolbar_actions(view, box, index, context),
        bottom_actions: generate_bottom_actions(view, box, index, context),
        boxes: generate_boxes(view, box, index, context),
        grid_item: generate_grid_item(view, box, index, context),
        list: generate_list(view, box, index, context),
        tab: generate_tab(view, box, index, context),
        wizard: generate_wizard(view, box, index, context),
        array: generate_array(view, box, index, context),
        object: generate_object(view, box, index, context),
        gallery: generate_gallery(view, box, index, context),
        options: generate_options(view, box, index, context)
      )
    end

    protected

    def field_descriptor_generator
      @field_descriptor_generator ||= definition.field_descriptor_generator.new(definition, resource_path)
    end

    def box_schema_generator
      @box_schema_generator ||= definition.box_schema_generator.new(definition, resource_path)
    end

    def array_box_parameters_generator
      @array_box_parameters_generator ||= definition.array_box_parameters_generator.new(definition, resource_path)
    end

    def object_box_parameters_generator
      @object_box_parameters_generator ||= definition.object_box_parameters_generator.new(definition, resource_path)
    end

    def grid_item_box_parameters_generator
      @grid_item_box_parameters_generator ||= definition.grid_item_box_parameters_generator.new(definition, resource_path)
    end

    def list_box_parameters_generator
      @list_box_parameters_generator ||= definition.list_box_parameters_generator.new(definition, resource_path)
    end

    def tab_box_parameters_generator
      @tab_box_parameters_generator ||= definition.tab_box_parameters_generator.new(definition, resource_path)
    end

    def wizard_box_parameters_generator
      @wizard_box_parameters_generator ||= definition.wizard_box_parameters_generator.new(definition, resource_path)
    end

    def gallery_box_parameters_generator
      @gallery_box_parameters_generator ||= definition.gallery_box_parameters_generator.new(definition, resource_path)
    end

    def action_descriptor_generator
      @action_descriptor_generator ||= definition.action_descriptor_generator.new(definition, resource_path)
    end

    def box_options_generator
      @box_options_generator ||= definition.box_options_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_type(_view, box, _index, _context)
      box.type
    end

    def generate_name(_view, box, index, _context)
      box.name || index.to_s
    end

    def generate_label(_view, box, _index, _context)
      box.label
    end

    def generate_read_only(_view, box, _index, _context)
      !!box.read_only
    end

    # Three-state on purpose: true (always a card), false (never a card, not even with a label)
    # and nil (unset - the frontend decides from the label, the toolbar actions and the surface).
    # Coercing nil to false here would strip the card off every labelled box.
    def generate_card(_view, box, _index, _context)
      box.card
    end

    def generate_collapsible(_view, box, _index, _context)
      box.collapsible&.to_s
    end

    # Box-level toolbar (box header / card header area), relative to the box root. Emitted for all box types
    # including 'list' - for a list box the table's own toolbar is carried separately by 'list.toolbar_actions'.
    def generate_toolbar_actions(_view, box, _index, context)
      return nil if box.toolbar_actions.nil?
      box.toolbar_actions.map do |action|
        action_descriptor_generator.generate(action, context)
      end.compact
    end

    # Box-level bottom actions (rendered below the box fields), relative to the box root.
    def generate_bottom_actions(_view, box, _index, context)
      return nil if box.bottom_actions.nil?
      box.bottom_actions.map do |action|
        action_descriptor_generator.generate(action, context)
      end.compact
    end

    def generate_boxes(view, box, _index, context)
      referenced_model = Habarico::BoxHelper.get_referenced_model(box) || definition.model
      boxes = box.boxes || view.boxes
      return nil if boxes.nil? || boxes.empty?
      boxes.enum_for(:each_with_index).map do |item, i|
        if item.is_a?(Habarico::Box)
          box_schema_generator.generate(view, item, i, context)
        else
          field_descriptor_generator.generate(referenced_model, item, context)
        end
      end
    end

    # Unlike the other type-specific parameters, `grid_item` is a placement rather than a box type:
    # any box carries it, so a grid cell can be a list/gallery/array box itself (HAB-963). A box
    # without a placement must emit no `grid_item` key at all - the frontend turns the computed spans
    # of the whole grid off as soon as one cell carries one, so an empty object would silently switch
    # every other cell to a full-width row.
    def generate_grid_item(_view, box, _index, context)
      return nil if box.grid_item.blank?
      grid_item_box_parameters_generator.generate(box, context)
    end

    def generate_list(_view, box, _index, context)
      return nil unless box.type == 'list'
      list_box_parameters_generator.generate(box, context)
    end

    def generate_tab(_view, box, _index, context)
      return nil unless box.type == 'tab'
      tab_box_parameters_generator.generate(box, context)
    end

    def generate_wizard(_view, box, _index, context)
      return nil unless box.type == 'wizard'
      wizard_box_parameters_generator.generate(box, context)
    end

    def generate_array(_view, box, _index, context)
      return nil unless box.type == 'array'
      array_box_parameters_generator.generate(box, context)
    end

    def generate_object(_view, box, _index, context)
      return nil unless box.type == 'object'
      object_box_parameters_generator.generate(box, context)
    end

    def generate_gallery(_view, box, _index, context)
      return nil unless box.type == 'gallery'
      gallery_box_parameters_generator.generate(box, context)
    end

    def generate_options(_view, box, _index, _context)
      box_options_generator.generate(box)
    end
  end
end
