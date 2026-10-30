module Habarico
  class ListBoxParametersGenerator < AbstractGenerator

    def generate(box, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::ListBox') unless box.is_a?(Habarico::ListBox)
      raise Eluvia::Errors::StandardError.new('Attributes `reference` of the `box` argument must be set') if box.reference.blank?
      raise Eluvia::Errors::StandardError.new('Attributes `target` or `extra_filters` of the `box` argument must be set') if box.target.blank? && box.extra_filters.blank?

      # Create model
      Habarico::ListBoxParameters.new(
        reference: generate_reference(box, context),
        target: generate_target(box, context),
        extra_filters: generate_extra_filters(box, context),
        filters: generate_filters(box, context),
        row_actions: generate_row_actions(box, context),
        list_actions: generate_list_actions(box, context),
        default_sorting: generate_default_sorting(box, context),
        sortable: generate_sortable(box, context),
        single_click_action: generate_single_click_action(box, context),
        double_click_action: generate_double_click_action(box, context),
      )
    end

    protected

    def filter_descriptor_generator
      @filter_descriptor_generator ||= definition.filter_descriptor_generator.new(definition, resource_path)
    end

    def sort_descriptor_generator
      @sort_descriptor_generator ||= definition.sort_descriptor_generator.new(definition, resource_path)
    end

    def action_descriptor_generator
      @action_descriptor_generator ||= definition.action_descriptor_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    # The resource the box lists, with the query its schema request carries: the author's
    # `schema_params` and the link to the record the surrounding view renders.
    def generate_reference(box, context)
      Habarico::ResourceReference.build(box.reference, params: schema_request_params(box, context))
    end

    def schema_request_params(box, context)
      link = Habarico::BoxHelper.parent_link_params(box, context, resource_name)
      (box.schema_params || {}).merge(link || {}).presence
    end

    def generate_target(box, _context)
      box.target
    end

    def generate_extra_filters(box, context)
      Habarico::CallableHelper.resolve(box.extra_filters, context)
    end

    def generate_filters(box, context)
      referenced_model = Habarico::BoxHelper.get_referenced_model(box) || definition.model

      # Generate filter descriptors
      filters = box.filters || []
      filters.map do |filter|
        filter_descriptor_generator.generate(referenced_model, filter, context)
      end
    end

    # Row buttons act on one record of the listed resource, whose id the row supplies - hence the
    # `detail` scope on an entry that names no resource: these slots are read in the schema of the
    # resource the box points at, which the box already names once in `reference`.
    #
    # Only a slot the author never mentioned carries the default; `nil` and `[]` both render nothing.
    def generate_row_actions(box, context)
      return default_actions(context, :detail) unless box.assigned?(:row_actions)
      generate_action_descriptors(box, box.row_actions, context)
    end

    # The collection's own buttons, above the table - same slot, the other scope.
    def generate_list_actions(box, context)
      return default_actions(context, :list) unless box.assigned?(:list_actions)
      generate_action_descriptors(box, box.list_actions, context)
    end

    def default_actions(context, scope)
      [action_descriptor_generator.generate(Habarico::DefaultActionsReference.new(scope: scope), context)].compact
    end

    # `list_source` is the box's own address - what `ResourceReference::LIST` stands for inside it.
    # These slots are read in the listed resource's own schema, so naming it is redundant here, but an
    # author who does gets the address rather than an exception, the way the box's header does.
    def generate_action_descriptors(box, actions, context)
      return nil if actions.nil?
      source = generate_reference(box, context)
      actions.map { |action| action_descriptor_generator.generate(action, context, list_source: source) }.compact
    end

    def generate_default_sorting(box, context)
      sort_descriptor_generator.generate(box.default_sorting || Habarico::BoxHelper.get_referenced_definition(box)&.default_sorting, context)
    end

    def generate_sortable(box, _context)
      return nil unless box.sortable_field_name.present?
      Habarico::SortableParameters.new(
        field_name: box.sortable_field_name,
        sort_for_filters: box.sortable_sort_for_filters,
      )
    end

    def generate_single_click_action(box, context)
      return nil if box.single_click_action.nil?
      action_descriptor_generator.generate(box.single_click_action, context, list_source: generate_reference(box, context))
    end

    def generate_double_click_action(box, context)
      return nil if box.double_click_action.nil?
      action_descriptor_generator.generate(box.double_click_action, context, list_source: generate_reference(box, context))
    end

  end
end
