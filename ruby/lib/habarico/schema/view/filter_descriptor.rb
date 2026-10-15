module Habarico
  class FilterDescriptor
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Name of the filter in API, used for coupling with filter schema
    string_attr :name

    # Override for `label` from filter schema
    string_attr :label

    # Override for `help_text` from filter schema
    string_attr :help_text

    # Override for `is_always_on` from filter schema
    boolean_attr :is_always_on

    # Override for `default_value` from filter schema
    any_attr :default_value

    # TODO options

  end
end
