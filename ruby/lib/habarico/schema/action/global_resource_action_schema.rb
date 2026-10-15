module Habarico
  class GlobalResourceActionSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Name of the action used for coupling with the action descriptor
    string_attr :name

    # Type of the action.
    # `view` - opens a new view as redirect or dialog
    # `link` - opens an external link
    # `resource` - performs an action on the resource (like delete, update, etc.
    string_attr :type
    # Deliberately a subset of Types::ACTION_TYPE - the global schema only advertises the action
    # types that can be rendered without a resource context.
    enum_attr :type, %i[view link resource]

    # Flag indicating if the action uses primary key or not
    boolean_attr :is_detail

    # Flag indicating if the action should be shown in detail view
    boolean_attr :show_in_detail

    # Flag indicating if the action should be shown in list view
    boolean_attr :show_in_list

  end
end
