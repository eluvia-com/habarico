module Habarico
  class ResourceActionParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Flag indicating if the resource action is a background task
    boolean_attr :is_background

    # Additional data which will be sent to the action
    any_attr :data

    # Definition of the endpoint
    has_one_attr :endpoint, 'Habarico::ResourceActionEndpointParameters'

  end
end
