module Habarico
  class GlobalResourceSchema < ResourceSchema

    # List of actions (buttons) available for the resource, for example: "detail", "create", "edit", "delete" or a custom action like "approve"
    has_many_attr :actions, 'Habarico::GlobalResourceActionSchema'

    # List of views available for the resource, for example: "list", "show", "create", "edit"
    has_many_attr :views, 'Habarico::GlobalViewSchema'

    # Definition of the menu item and its parents associated with this resource
    has_one_attr :menu, 'Habarico::MenuSchema'

  end
end
