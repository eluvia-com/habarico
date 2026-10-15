module Habarico
  class LocalResourceSchema < ResourceSchema

    # List of actions (buttons) available for the resource, for example: "detail", "create", "edit", "delete" or a custom action like "approve"
    has_many_attr :actions, 'Habarico::ResourceActionSchema'

    # List of views available for the resource, for example: "list", "show", "create", "edit"
    has_many_attr :views, 'Habarico::ViewSchema'

    # Definition of the API underlying this resource
    has_one_attr :endpoints, 'Habarico::EndpointsSchema'

  end
end
