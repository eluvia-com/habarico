module Habarico
  class ObjectResourceSchema < ResourceSchema

    # List of actions (buttons) available for the resource, for example: "detail", "create", "edit", "delete" or a custom action like "approve"
    has_many_attr :actions, 'Habarico::ResourceActionSchema'

  end
end
