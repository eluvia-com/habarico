module Habarico
  class ActionDescriptor
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Name of the action, used for coupling with resource action schema
    string_attr :name

    # Override for `label` from action schema
    string_attr :label

    # Override for `icon` from action schema
    string_attr :icon

    # Override for `color` from action schema
    string_attr :color
    enum_attr :color, Types::COLOR_TYPE

    # Special action in case no resource action schema is coupled
    has_one_attr :action, 'Habarico::ActionSchema'

    # View parameters for the action descriptor (mode, choices, parameters)
    has_one_attr :view, 'Habarico::ViewActionDescriptorParameters'

    # Nested menu items for dropdown/submenu actions
    has_many_attr :menu_items, 'Habarico::ActionDescriptor'

  end
end
