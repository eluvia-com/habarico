require 'habarico/contrib/preferences'

Habarico.setup do |config|
  # The resource names are singular to match the Python backend: a resource name is what the
  # frontend asks for (`eshop/product`), so the one admin build serves either backend.
  config.resources = [{ admin: %i[product category order customer] }]
  config.routing_url_prefix = '/api'
  config.routing_scope      = 'apps'
  config.currency           = 'USD'

  # Habarico's own endpoints - the schema and the user preferences - authenticate the way the
  # resources do, through ApplicationController#authenticate_request.
  config.base_controller_class = 'ApplicationController'
end
