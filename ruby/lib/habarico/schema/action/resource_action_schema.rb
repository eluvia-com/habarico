module Habarico
  class ResourceActionSchema < ActionSchema

    # Name of the action used for coupling with the action descriptor
    string_attr :name

    # Flag indicating if the action should be shown in detail view
    boolean_attr :show_in_detail

    # Flag indicating if the action should be shown in list view
    boolean_attr :show_in_list

  end
end
