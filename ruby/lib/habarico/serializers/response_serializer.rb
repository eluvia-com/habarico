module Habarico
  module Serializers
    # Serializes a `Habarico::Response` of a custom action into an `ActionResult`: `message`, `state`
    # and `trigger_action` live under `meta`, and the response's own `data` is merged next to it.
    # This is the shape the contract prescribes and the only one the frontend reads - it looks at
    # `resp.data.meta` and nowhere else.
    class ResponseSerializer
      # `action_schema_for` turns `Response#action` into its `ActionSchema` - the controller's
      # `build_action_schema`, so an override of it keeps applying.
      def initialize(action_schema_for:)
        @action_schema_for = action_schema_for
      end

      def serialize(response)
        meta = {
          'message' => response.message,
          'state' => response.state,
          'trigger_action' => Serializers.compact_json(@action_schema_for.call(response.action))
        }.compact
        { 'meta' => meta }.merge(response.data.presence || {})
      end
    end
  end
end
