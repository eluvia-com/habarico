module Habarico
  class SortableParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Name of the field to sort by when drag-and-drop reordering
    string_attr :field_name

    # Additional filters to scope the sortable operation (e.g. group by parent)
    any_attr :sort_for_filters

  end
end
