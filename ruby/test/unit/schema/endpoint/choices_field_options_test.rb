require "test_helper"

module Habarico
  class ChoicesFieldOptionsTest < Minitest::Test

    def test_accepts_icons_key
      opts = ChoicesFieldOptions.new(icons_key: "status_icons")
      assert_equal "status_icons", opts.icons_key
    end

    def test_defaults_are_nil
      opts = ChoicesFieldOptions.new
      assert_nil opts.icons_key
    end

  end
end
