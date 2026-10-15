module Habarico
  class Box
    include DefinitionModel

    attr_accessor :type, :label, :name, :read_only, :card, :collapsible, :boxes, :show_query, :required_query, :toolbar_actions, :bottom_actions

    # Gallery
    attr_accessor :reference, :target, :image_field, :schema_params, :extra_filters

    # Array
    attr_accessor :target, :inline # rubocop:disable Lint/DuplicateMethods -- intentional for readability

    # Grid Item
    attr_accessor :xs, :sm, :md, :lg, :xl

    # List
    attr_accessor :reference, :target, :extra_filters, :row_actions, :list_toolbar_actions, :list_actions, :filters, :default_sorting, # rubocop:disable Lint/DuplicateMethods -- intentional for readability
                  :sortable_field_name, :sortable_sort_for_filters, :single_click_action, :double_click_action

    # Object
    attr_accessor :target # rubocop:disable Lint/DuplicateMethods -- intentional for readability

    # Tab / Wizard
    attr_accessor :show_toolbar_navigation, :validate_steps

    def initialize(params = {})
      super(params)
      @type = 'simple'
    end

  end
end
