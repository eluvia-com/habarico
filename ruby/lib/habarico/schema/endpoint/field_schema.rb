module Habarico
  class FieldSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute
    include Habarico::ExtensibleEnum

    # Name of the field in the data model, used for coupling with field descriptor
    string_attr :name

    # Data type of the field
    string_attr :type
    extensible_enum_attr :type, :FIELD_TYPE

    # Format of the field, applied to specific data types such as string
    string_attr :format
    extensible_enum_attr :format, :FIELD_FORMAT_TYPE

    # Human-readable label for the field
    string_attr :label

    # Short label for the field, used in compact displays
    string_attr :short_label

    # Human-readable help text for the field displayed usually under the field or as placeholder
    string_attr :help_text

    # Flag indicating if the field is read-only
    boolean_attr :read_only

    # Flag indicating if the field is write-only
    boolean_attr :write_only

    # Flag indicating if the field can be null
    boolean_attr :nullable

    # Flag indicating if the field is required
    boolean_attr :required

    # Default value for the field
    any_attr :default_value

    # Flag indicating if the field is sortable
    boolean_attr :sortable

    # Field name to use for sorting if different from the field name
    string_attr :sort_by

    # Reference to another resource
    has_one_attr :reference, 'Habarico::ResourceReference'

    # Enumeration items for field with predefined choices, usually used with 'choices' format
    has_many_attr :enum, 'Habarico::EnumType'

    # Schema of items in case of 'array' type
    has_one_attr :items, 'Habarico::FieldSchema'

    # Schema of properties in case of 'object' type
    has_many_attr :properties, 'Habarico::FieldSchema'

    # Additional options for the value formating and display
    has_one_attr :options, 'Habarico::FieldOptions'

  end
end
