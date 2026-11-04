module Habarico
  class FilterSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute
    include Habarico::ActiveModel::ExtensibleEnum

    # Name of the filter in API, used for coupling with filter descriptor
    string_attr :name

    # Data type of the filter field
    string_attr :type
    extensible_enum_attr :type, Types::FIELD_TYPE

    # Format of the filter field, applied to specific data types such as string
    string_attr :format
    extensible_enum_attr :format, Types::FIELD_FORMAT_TYPE

    # Human-readable label for the filter
    string_attr :label

    # Human-readable help text for the filter displayed usually under the field or as placeholder
    string_attr :help_text

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

    # Flag indicating if the filter is always visible in the filters panel and cannot be removed by the user
    boolean_attr :is_always_on

  end
end
