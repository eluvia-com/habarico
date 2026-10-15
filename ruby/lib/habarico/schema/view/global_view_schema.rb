module Habarico
  class GlobalViewSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Name of the view, usually "list", "show", "create", "edit"
    string_attr :name

    # Type of the view
    string_attr :type
    enum_attr :type, Types::VIEW_TYPE

    # Flag indicating if the view is detail (uses primary key)
    boolean_attr :is_detail

    # Default presentation mode when a trigger opens this view without its own mode.
    # When omitted, the frontend falls back to `redirect`.
    string_attr :mode
    enum_attr :mode, Types::VIEW_MODE_TYPE

    # Definition of the endpoint
    has_one_attr :endpoint, 'Habarico::ViewEndpointParameters'
  end
end
