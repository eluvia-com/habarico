module Habarico
  class ListViewParametersGenerator < AbstractGenerator

    def generate(view, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `view` must be a Habarico::View') unless view.is_a?(Habarico::View)

      # Create model
      Habarico::ListViewParameters.new(
        boxes: generate_boxes(view, context),
        filters: generate_filters(view, context),
        row_actions: generate_row_actions(view, context),
        toolbar_actions: generate_toolbar_actions(view, context),
        list_actions: generate_list_actions(view, context),
        default_sorting: generate_default_sorting(view, context),
        single_click_action: generate_single_click_action(view, context),
        double_click_action: generate_double_click_action(view, context),
      )
    end

    protected

    def field_descriptor_generator
      @field_descriptor_generator ||= definition.field_descriptor_generator.new(definition, resource_path)
    end

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

    def generate_boxes(view, context)
      boxes = view.boxes
      return nil if boxes.nil? || boxes.empty?
      boxes.map do |field|
        field_descriptor_generator.generate(definition.model, field, context)
      end
    end

    def generate_filters(view, context)
      # Toolbar filters (always-on). These take precedence: any standard filter with the
      # same name is dropped below so a filter is never rendered twice.
      toolbar_filters = (view.respond_to?(:toolbar_filters) ? view.toolbar_filters : nil) || []
      toolbar_names = toolbar_filters.map { |filter| filter_reference_name(filter) }

      # Standard (drawer) filters, falling back to the definition-level filter set. Exclude
      # anything already promoted to the toolbar to avoid duplicates.
      standard_filters = (view.respond_to?(:filters) ? view.filters : nil) || definition.filters || []
      standard_filters = standard_filters.reject { |filter| toolbar_names.include?(filter_reference_name(filter)) }

      toolbar_descriptors = toolbar_filters.map do |filter|
        filter_descriptor_generator.generate(definition.model, filter, context, is_always_on: true)
      end
      standard_descriptors = standard_filters.map do |filter|
        filter_descriptor_generator.generate(definition.model, filter, context)
      end

      toolbar_descriptors + standard_descriptors
    end

    # Normalize a filter entry (Symbol, String or FilterReference) to its name for comparison.
    def filter_reference_name(filter)
      filter.is_a?(Habarico::FilterReference) ? filter.name.to_s : filter.to_s
    end

    # Row buttons act on one record, whose id the row supplies - hence the `detail` scope on an
    # entry that names no resource: a view's own slot is read in the schema it belongs to.
    #
    # Only a slot the author never mentioned carries the default. `nil` and `[]` are both decisions
    # to render nothing, which is why `assigned?` and not a nil check decides.
    def generate_row_actions(view, context)
      return default_actions(view, context, :detail) unless view.assigned?(:row_actions)
      generate_action_descriptors(view.row_actions, context)
    end

    # Everything the resource supports, until the view says otherwise.
    def generate_toolbar_actions(view, context)
      return default_actions(view, context, nil) unless view.assigned?(:toolbar_actions)
      generate_action_descriptors(view.toolbar_actions, context)
    end

    def default_actions(_view, context, scope)
      [action_descriptor_generator.generate(Habarico::DefaultActionsReference.new(scope: scope), context)].compact
    end

    def generate_action_descriptors(actions, context)
      return nil if actions.nil?
      actions.map { |action| action_descriptor_generator.generate(action, context) }.compact
    end

    # Utility actions of the table (export, print, ...) rendered next to the filter bar.
    def generate_list_actions(view, context)
      unless view.list_actions.nil?
        return view.list_actions.map do |action|
          action_descriptor_generator.generate(action, context)
        end.compact
      end
      nil
    end

    def generate_default_sorting(view, context)
      sort_descriptor_generator.generate(view.default_sorting || definition.default_sorting, context)
    end

    def generate_single_click_action(view, context)
      return nil if view.single_click_action.nil?
      action_descriptor_generator.generate(view.single_click_action, context)
    end

    def generate_double_click_action(view, context)
      return nil if view.double_click_action.nil?
      action_descriptor_generator.generate(view.double_click_action, context)
    end

  end
end
