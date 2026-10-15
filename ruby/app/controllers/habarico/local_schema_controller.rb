module Habarico
  class LocalSchemaController < ApplicationController

    def index
      # Path is something like this: /xxx/:resource_name/schema
      resource_name = request.path.split('/')[-2]
      raise Eluvia::Errors::BadRequest.new("Missing resource name in the request path.") unless resource_name

      # Prepare context and generate schema
      context = Habarico::Context.new(
        current_user: current_user,
        target: (JSON.parse(params['_target']) rescue {}).symbolize_keys,
        source: (JSON.parse(params['_source']) rescue {}).symbolize_keys
      )
      render json: Habarico::SchemaService.instance.get_local_schema(resource_name, context).as_json.deep_compact(compactable: [nil, {}].freeze)
    end

    def show
      # Path is something like this: /xxx/:resource_name/:id/schema
      resource_name = request.path.split('/')[-3]
      raise Eluvia::Errors::BadRequest.new("Missing resource name in the request path.") unless resource_name
      raise Eluvia::Errors::BadRequest.new("Missing record PK in the request path.") unless params[:id]

      # Prepare context and generate schema
      context = Habarico::Context.new(
        current_user: current_user,
        record_pk: params[:id],
        target: (JSON.parse(params['_target']) rescue {}).symbolize_keys,
        source: (JSON.parse(params['_source']) rescue {}).symbolize_keys
      )
      render json: Habarico::SchemaService.instance.get_local_schema(resource_name, context).as_json.deep_compact(compactable: [nil, {}].freeze)
    end

  end
end
