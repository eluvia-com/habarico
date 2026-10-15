module Habarico
  class ListBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Reference to another resource
    string_attr :reference

    # Name of the attribute in the references resource to use as the coupling value
    string_attr :target

    # Additional filters to be applied to the list by default, can be used instead of target
    any_attr :extra_filters

    # List of filters to be displayed / available to the list
    has_many_attr :filters, 'Habarico::FilterDescriptor'

    # In case we don't want to show the default set of resource actions, a custom set of action descriptors can be provided and displayed in each row
    has_many_attr :row_actions, 'Habarico::ActionDescriptor'

    # Actions rendered in the table's own toolbar (top of the resource list, e.g. create), separate from the
    # box-level toolbar which belongs to the box root
    has_many_attr :toolbar_actions, 'Habarico::ActionDescriptor'

    # Utility actions of the table (export, print, ...) rendered next to the filter bar, separate from row and toolbar actions
    has_many_attr :list_actions, 'Habarico::ActionDescriptor'

    # Default sorting for the list
    has_one_attr :default_sorting, 'Habarico::SortDescriptor'

    # Drag & drop sortable configuration
    has_one_attr :sortable, 'Habarico::SortableParameters'

    # Additional parameters sent with the get schema request
    has_many_attr :schema_params, 'String', underlying_type: :hash

    # Action to activate on a single row click (e.g. open a record preview in a side panel)
    has_one_attr :single_click_action, 'Habarico::ActionDescriptor'

    # Action to activate on a row double-click
    has_one_attr :double_click_action, 'Habarico::ActionDescriptor'

  end
end
