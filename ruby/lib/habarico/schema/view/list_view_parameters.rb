module Habarico
  class ListViewParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # List of fields to be displayed / available in the list
    has_many_attr :boxes, 'Habarico::FieldDescriptor'

    # List of filters to be displayed / available to the list
    has_many_attr :filters, 'Habarico::FilterDescriptor'

    # In case we don't want to show the default set of resource actions, a custom set of action descriptors can be provided and displayed in each row
    has_many_attr :row_actions, ['Habarico::ActionDescriptor', 'Habarico::DefaultActionsDescriptor'], default: 'Habarico::ActionDescriptor'

    # In case we don't want to show the default set of resource actions, a custom set of action descriptors can be provided and displayed in the tollbar
    has_many_attr :toolbar_actions, ['Habarico::ActionDescriptor', 'Habarico::DefaultActionsDescriptor'], default: 'Habarico::ActionDescriptor'

    # Utility actions of the table (export, print, ...) rendered next to the filter bar, separate from row and toolbar actions
    has_many_attr :list_actions, ['Habarico::ActionDescriptor', 'Habarico::DefaultActionsDescriptor'], default: 'Habarico::ActionDescriptor'

    # Default sorting for the list
    has_one_attr :default_sorting, 'Habarico::SortDescriptor'

    # Action to activate on a single row click (e.g. open a record preview in a side panel)
    has_one_attr :single_click_action, 'Habarico::ActionDescriptor'

    # Action to activate on a row double-click
    has_one_attr :double_click_action, 'Habarico::ActionDescriptor'

  end
end
