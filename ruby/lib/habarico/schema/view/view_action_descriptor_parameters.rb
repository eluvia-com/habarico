module Habarico
  class ViewActionDescriptorParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Mode in which to display the action view: redirect to a standalone page, dialog, or side panel
    string_attr :mode
    enum_attr :mode, Types::VIEW_MODE_TYPE

    # View choices for the action
    has_many_attr :choices, 'Habarico::ActionViewChoice'

    # Additional parameters for the view
    has_many_attr :parameters, 'String', underlying_type: :hash

    # Keep linked parent in the URL when navigating to the linked resource
    boolean_attr :keep_linked_parent

  end
end
