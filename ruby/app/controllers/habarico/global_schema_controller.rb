module Habarico
  class GlobalSchemaController < ApplicationController

    def index
      # Prepare context and generate schema
      context = Habarico::Context.new(current_user: current_user)
      render_schema(Habarico::SchemaService.instance.get_global_schema(context))
    end

  end
end
