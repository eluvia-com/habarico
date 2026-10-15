module Habarico
  class ResourceSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Name of the resource in the API, used for coupling with actions
    string_attr :name

    # Human-readable label for the resource
    string_attr :label

    # Primary key field name for the resource, usually "id"
    string_attr :pk_field_name

  end
end
