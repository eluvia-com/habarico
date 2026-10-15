require "test_helper"

module Habarico
  class ImageFieldOptionsTest < Minitest::Test

    def test_accepts_resize_width
      opts = ImageFieldOptions.new(resize_width: 800)
      assert_equal 800, opts.resize_width
    end

    def test_accepts_crop_aspect_ratio
      opts = ImageFieldOptions.new(crop_aspect_ratio: "16:9")
      assert_equal "16:9", opts.crop_aspect_ratio
    end

    def test_accepts_both
      opts = ImageFieldOptions.new(resize_width: 1200, crop_aspect_ratio: "4:3")
      assert_equal 1200, opts.resize_width
      assert_equal "4:3", opts.crop_aspect_ratio
    end

    def test_defaults_are_nil
      opts = ImageFieldOptions.new
      assert_nil opts.resize_width
      assert_nil opts.crop_aspect_ratio
    end

  end
end
