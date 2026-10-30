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

    # What the view's endpoint addresses: which resource, which record, which action. `path` and
    # `method` have no place on a view action - how a thing is called is not part of where it is.
    has_one_attr :endpoint, 'Habarico::ResourceReference'

    # Additional parameters to be passed to the view
    has_many_attr :parameters, 'String', underlying_type: :hash

    # Choices offered before the view opens, each carrying its own view parameters
    has_many_attr :choices, 'Habarico::ActionViewChoice'

    # Keep linked parent in the URL when navigating to the linked resource
    boolean_attr :keep_linked_parent

  end
end
