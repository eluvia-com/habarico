module Habarico
  class FieldWrapperProperties
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Fields of the wrapper
    has_many_attr :fields, 'Habarico::FieldDescriptor'

    # Divider between fields
    string_attr :divider

  end
end
