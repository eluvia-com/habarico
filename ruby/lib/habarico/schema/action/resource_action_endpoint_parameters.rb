module Habarico
  class ResourceActionEndpointParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # API path for the requested endpoint
    string_attr :path

    # HTTP method for the requested endpoint
    string_attr :method
    enum_attr :method, Types::REQUEST_METHOD_TYPE

    # What the endpoint addresses. Absent means the resource the schema was generated for.
    has_one_attr :reference, 'Habarico::ResourceReference'

  end
end
