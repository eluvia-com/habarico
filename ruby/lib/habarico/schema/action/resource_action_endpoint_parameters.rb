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

    # Reference to another resource, if applicable
    string_attr :reference

    # Name of the controller action associated with the endpoint, if applicable
    string_attr :action_name

    # Primary key of the requested record, if applicable
    string_attr :record_pk

  end
end
