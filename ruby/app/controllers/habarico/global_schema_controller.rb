module Habarico
  class GlobalSchemaController < ApplicationController

    def index
      # Prepare context and generate schema
      context = Habarico::Context.new(current_user: current_user)
      render json: Habarico::SchemaService.instance.get_global_schema(context).as_json.deep_compact(compactable: [nil, {}].freeze)
    end

  end
end
