module Habarico
  class MenuGroupSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Name of the menu item or group, used for coupling with each other
    string_attr :name

    # Human-readable label for the menu item or group
    string_attr :label

    # Icon for the menu item or group
    string_attr :icon

    # Color of the menu item or group. Uses standard MUI color types
    string_attr :color
    enum_attr :color, Types::COLOR_TYPE

    # Priority for ordering menu items in the menu
    integer_attr :priority

    # Parent menu group for nested menu structures
    has_one_attr :parent, 'Habarico::MenuGroupSchema'
  end
end
