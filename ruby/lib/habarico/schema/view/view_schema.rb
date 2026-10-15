module Habarico
  class ViewSchema
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

    # Human-readable label of the view
    string_attr :label

    # Definition of the list, applicable for list views
    has_one_attr :list, 'Habarico::ListViewParameters'

    # Definition of the detail, applicable for detail views
    has_one_attr :detail, 'Habarico::DetailViewParameters'

    # Definition of the endpoint
    has_one_attr :endpoint, 'Habarico::ViewEndpointParameters'

    # Breadcrumbs for navigation in case we need not standard ones
    has_many_attr :breadcrumbs, 'Habarico::MenuSchema'

  end
end
