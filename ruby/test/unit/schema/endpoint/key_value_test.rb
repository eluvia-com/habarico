require "test_helper"

module Habarico
  class KeyValueTest < Minitest::Test

    def test_accepts_key_and_value
      kv = KeyValue.new(key: "status", value: "active")
      assert_equal "status", kv.key
      assert_equal "active", kv.value
    end

    def test_defaults_are_nil
      kv = KeyValue.new
      assert_nil kv.key
      assert_nil kv.value
    end

  end
end
