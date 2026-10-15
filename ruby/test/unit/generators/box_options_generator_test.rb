require "test_helper"

module Habarico
  class BoxOptionsGeneratorTest < Minitest::Test

    def setup
      @definition = Definition.new
      @generator = BoxOptionsGenerator.new(@definition, "test_resource")
    end

    def test_generates_options_with_show_query
      box = Box.new(show_query: "status == 'active'")
      result = @generator.generate(box)
      assert_instance_of BoxOptions, result
      assert_instance_of DynamicRenderOptions, result.dynamic_render
      assert_equal "status == 'active'", result.dynamic_render.show_query
      assert_nil result.dynamic_render.required_query
    end

    def test_generates_options_with_required_query
      box = Box.new(required_query: "mode == 'strict'")
      result = @generator.generate(box)
      assert_instance_of BoxOptions, result
      assert_equal "mode == 'strict'", result.dynamic_render.required_query
      assert_nil result.dynamic_render.show_query
    end

    def test_generates_options_with_both_queries
      box = Box.new(show_query: "visible == true", required_query: "type == 'full'")
      result = @generator.generate(box)
      assert_instance_of BoxOptions, result
      assert_equal "visible == true", result.dynamic_render.show_query
      assert_equal "type == 'full'", result.dynamic_render.required_query
    end

  end
end
