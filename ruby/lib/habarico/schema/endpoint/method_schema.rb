module Habarico
  class MethodSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # List of fields supported by the API
    has_many_attr :fields, 'Habarico::FieldSchema'

    # List of filters supported by the API
    has_many_attr :filters, 'Habarico::FilterSchema'

  end
end
