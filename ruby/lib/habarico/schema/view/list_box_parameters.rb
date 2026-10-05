module Habarico
  class ListBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Address of the resource the box lists, carrying the query its schema request is made with
    has_one_attr :reference, 'Habarico::ResourceReference'

    # Name of the attribute in the references resource to use as the coupling value
    string_attr :target

    # Additional filters to be applied to the list by default, can be used instead of target
    any_attr :extra_filters

    # List of filters to be displayed / available to the list
    has_many_attr :filters, 'Habarico::FilterDescriptor'

    # In case we don't want to show the default set of resource actions, a custom set of action descriptors can be provided and displayed in each row
    has_many_attr :row_actions, ['Habarico::ActionDescriptor', 'Habarico::DefaultActionsDescriptor'], default: 'Habarico::ActionDescriptor'

    # Actions rendered above the table (create, export, ...), next to the filter bar
    has_many_attr :list_actions, ['Habarico::ActionDescriptor', 'Habarico::DefaultActionsDescriptor'], default: 'Habarico::ActionDescriptor'

    # Default sorting for the list
    has_one_attr :default_sorting, 'Habarico::SortDescriptor'

    # Drag & drop sortable configuration
    has_one_attr :sortable, 'Habarico::SortableParameters'

    # Action to activate on a single row click (e.g. open a record preview in a side panel)
    has_one_attr :single_click_action, 'Habarico::ActionDescriptor'

    # Action to activate on a row double-click
    has_one_attr :double_click_action, 'Habarico::ActionDescriptor'

  end
end
