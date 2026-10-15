module Habarico
  class EnumType
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Value of the enum item
    string_attr :value

    # Human-readable label of the enum item
    string_attr :label

    # Color of the enum item. Uses standard MUI color types
    string_attr :color
    enum_attr :color, Types::COLOR_TYPE

    # Icon of the enum item
    string_attr :icon

  end
end
