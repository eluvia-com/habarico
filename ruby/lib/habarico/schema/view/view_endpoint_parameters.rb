module Habarico
  class ViewEndpointParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Path of the endpoint to call. Only set when the standard resource path is not used, i.e. for
    # action views; for the standard views the frontend derives the path from the resource itself.
    string_attr :path

    # HTTP method for the requested endpoint
    string_attr :method
    enum_attr :method, Types::REQUEST_METHOD_TYPE

    # Reference to another resource, if applicable
    string_attr :reference

    # Name of the controller action associated with the endpoint, if applicable
    string_attr :action_name

  end
end
