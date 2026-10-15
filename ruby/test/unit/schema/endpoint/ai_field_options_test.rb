require "test_helper"

module Habarico
  class AiFieldOptionsTest < Minitest::Test

    def test_accepts_source_fields
      opts = AiFieldOptions.new(source_fields: %w[title body])
      assert_equal %w[title body], opts.source_fields
    end

    def test_defaults_are_nil
      opts = AiFieldOptions.new
      assert_nil opts.source_fields
    end

  end
end
