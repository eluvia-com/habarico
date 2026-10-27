module Habarico
  module Serializers
    # Serializes a `Habarico::Response` of a custom action into an `ActionResult`: `message`, `state`
    # and `trigger_action` live under `meta`, and the response's own `data` is merged next to it.
    # This is the shape the contract prescribes and the only one the frontend reads - it looks at
    # `resp.data.meta` and nowhere else.
    class ResponseSerializer
      # `trigger_action_schema_for` is called with `Response#action` and answers its
      # `Habarico::ActionSchema` (or nil).
      def initialize(trigger_action_schema_for:)
        @trigger_action_schema_for = trigger_action_schema_for
      end

      def serialize(response)
        meta = {
          'message' => response.message,
          'state' => response.state,
          'trigger_action' => Serializers.compact_json(@trigger_action_schema_for.call(response.action))
        }.compact
        { 'meta' => meta }.merge(response.data.presence || {})
      end
    end
  end
end
