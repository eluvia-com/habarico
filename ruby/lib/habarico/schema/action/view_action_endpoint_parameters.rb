module Habarico
  class ViewActionEndpointParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Reference to another resource, if applicable
    string_attr :reference

    # Name of the controller action associated with the endpoint, if applicable
    string_attr :action_name

    # Primary key of the requested record, if applicable
    string_attr :record_pk

  end
end
