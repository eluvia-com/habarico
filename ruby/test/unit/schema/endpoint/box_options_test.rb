require "test_helper"

module Habarico
  class BoxOptionsTest < Minitest::Test

    def test_accepts_dynamic_render
      dr = DynamicRenderOptions.new(show_query: "status == 'active'", required_query: "type == 'full'")
      opts = BoxOptions.new(dynamic_render: dr)
      assert_equal dr, opts.dynamic_render
      assert_equal "status == 'active'", opts.dynamic_render.show_query
      assert_equal "type == 'full'", opts.dynamic_render.required_query
    end

    def test_default_dynamic_render_is_nil
      opts = BoxOptions.new
      assert_nil opts.dynamic_render
    end

    def test_dynamic_render_with_only_show_query
      dr = DynamicRenderOptions.new(show_query: "published == true")
      opts = BoxOptions.new(dynamic_render: dr)
      assert_equal "published == true", opts.dynamic_render.show_query
      assert_nil opts.dynamic_render.required_query
    end

    def test_dynamic_render_with_only_required_query
      dr = DynamicRenderOptions.new(required_query: "type == 'contract'")
      opts = BoxOptions.new(dynamic_render: dr)
      assert_nil opts.dynamic_render.show_query
      assert_equal "type == 'contract'", opts.dynamic_render.required_query
    end

  end
end
