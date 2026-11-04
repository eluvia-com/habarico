module Habarico
  class ApplicationController < Habarico::Config.base_controller_class.constantize
    include Eluvia::ErrorHandler
    include Habarico::Authenticatable

    # ***************************************************************************
    # JSON as default format
    # ***************************************************************************

    before_action do
      request.format = :json if %w[text/html */*].include?(request.format.to_s)
    end

    private

    # Renders a generated schema; `SchemaService` answers nil for a resource it does not know.
    def render_schema(schema)
      raise Eluvia::Errors::NotFound.new('Resource not found.') if schema.nil?

      render json: Habarico::Serializers.compact_json(schema)
    end

  end
end
