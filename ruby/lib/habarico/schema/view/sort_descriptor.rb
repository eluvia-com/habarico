module Habarico
  class SortDescriptor
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Name of the field to sort by
    string_attr :field_name

    # Direction of the sort
    string_attr :direction
    enum_attr :direction, Types::SORT_DIRECTION_TYPE

  end
end
