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
        toolbar_actions: generate_toolbar_actions(box, context),
        list_actions: generate_list_actions(box, context),
        default_sorting: generate_default_sorting(box, context),
        sortable: generate_sortable(box, context),
        schema_params: generate_schema_params(box, context),
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

    def generate_reference(box, _context)
      box.reference
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

    def generate_row_actions(box, context)
      unless box.row_actions.nil?
        return box.row_actions.map do |action|
          action_descriptor_generator.generate(action, context)
        end.compact
      end
      nil
    end

    # Table's own toolbar (top of the resource list, e.g. create). Fed by the ListBox's `list_toolbar_actions`,
    # separate from the box-level `toolbar_actions` which is emitted at the box root.
    def generate_toolbar_actions(box, context)
      unless box.list_toolbar_actions.nil?
        return box.list_toolbar_actions.map do |action|
          action_descriptor_generator.generate(action, context)
        end.compact
      end
      nil
    end

    # Utility actions of the table (export, print, ...) rendered next to the filter bar.
    def generate_list_actions(box, context)
      unless box.list_actions.nil?
        return box.list_actions.map do |action|
          action_descriptor_generator.generate(action, context)
        end.compact
      end
      nil
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

    def generate_schema_params(box, _context)
      box.schema_params
    end

    def generate_single_click_action(box, context)
      return nil if box.single_click_action.nil?
      action_descriptor_generator.generate(box.single_click_action, context)
    end

    def generate_double_click_action(box, context)
      return nil if box.double_click_action.nil?
      action_descriptor_generator.generate(box.double_click_action, context)
    end

  end
end
