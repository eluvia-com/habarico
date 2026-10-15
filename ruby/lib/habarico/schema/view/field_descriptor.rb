module Habarico
  class FieldDescriptor
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    intended_for_types :field

    # Type of the descriptor, always 'field'
    string_attr :type
    enum_attr :type, [:field]

    # Name of the field in the data model, used for coupling with field schema
    string_attr :name

    # Override for `label` from field schema
    string_attr :label

    # Override for `short_label` from field schema
    string_attr :short_label

    # Override for `help_text` from field schema
    string_attr :help_text

    # Override for `sortable` from field schema
    boolean_attr :sortable

    # Override for `sort_by` from field schema
    string_attr :sort_by

    # Override for `read_only` from field schema
    boolean_attr :read_only

    # Override for `write_only` from field schema
    boolean_attr :write_only

    # Override for `default_value` from field schema
    any_attr :default_value

    # Action to trigger when the field value is clicked
    has_one_attr :action, 'Habarico::ActionDescriptor'

    # Wrapper properties for grouping multiple fields in one column
    has_one_attr :wrapper, 'Habarico::FieldWrapperProperties'

    # Override for `options` from field schema
    has_one_attr :options, 'Habarico::FieldOptions'

  end
end
