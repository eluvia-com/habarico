require "test_helper"

module Habarico
  module Serializers
    class ResponseSerializerTest < Minitest::Test

      def serialize(response, action_schema: nil)
        actions = []
        trigger_action_schema_for = lambda do |action|
          actions << action
          action_schema
        end
        [ResponseSerializer.new(trigger_action_schema_for: trigger_action_schema_for).serialize(response), actions]
      end

      def test_meta_carries_message_and_state
        result, = serialize(Habarico::Response.new(message: 'Order shipped.'))

        assert_equal({ 'meta' => { 'message' => 'Order shipped.', 'state' => :success } }, result)
      end

      def test_data_is_merged_next_to_meta
        result, = serialize(Habarico::Response.new(data: { 'tracking_number' => 'TRK-1' }))

        assert_equal %w[meta tracking_number], result.keys
      end

      def test_trigger_action_is_built_from_the_response_action_and_compacted
        result, actions = serialize(Habarico::Response.new(action: 'show'),
                                    action_schema: { 'name' => 'show', 'label' => nil, 'view' => {} })

        assert_equal ['show'], actions
        assert_equal({ 'name' => 'show' }, result['meta']['trigger_action'])
      end

    end
  end
end
