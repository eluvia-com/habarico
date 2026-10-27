require "test_helper"

module Habarico
  module Serializers
    class CompactJsonTest < Minitest::Test

      def test_drops_nil_values_and_empty_hashes_at_any_depth
        assert_equal({ 'name' => 'orders', 'actions' => [{ 'name' => 'detail' }] },
                     Serializers.compact_json({ name: 'orders', label: nil, actions: [{ name: 'detail', confirm_dialog: {} }] }))
      end

      def test_nil_stays_nil
        assert_nil Serializers.compact_json(nil)
      end

    end
  end
end
