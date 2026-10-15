module Habarico
  class ViewActionParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Name of the view to be rendered, used for coupling with view schema
    string_attr :name

    # Mode in which to display the action view: redirect to a standalone page, dialog, or side panel
    string_attr :mode
    enum_attr :mode, Types::VIEW_MODE_TYPE

    # Width of the dialog, only used when mode is dialog (MUI breakpoint or CSS width value)
    string_attr :dialog_width

    # Definition of the endpoint
    has_one_attr :endpoint, 'Habarico::ViewActionEndpointParameters'

    # Additional parameters to be passed to the view
    has_many_attr :parameters, 'String', underlying_type: :hash

    # Keep linked parent in the URL when navigating to the linked resource
    boolean_attr :keep_linked_parent

  end
end
