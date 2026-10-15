module Habarico
  class EndpointsSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Endpoint definition for GET method
    has_one_attr :get, 'Habarico::MethodSchema'

    # Endpoint definition for POST method
    has_one_attr :post, 'Habarico::MethodSchema'

    # Endpoint definition for PATCH method
    has_one_attr :patch, 'Habarico::MethodSchema'

    # Endpoint definition for PUT method
    has_one_attr :put, 'Habarico::MethodSchema'

    # Endpoint definition for DELETE method
    has_one_attr :delete, 'Habarico::MethodSchema'

  end
end
