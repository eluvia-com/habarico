require "test_helper"

module Habarico
  class FieldOptionsTest < Minitest::Test

    def test_accepts_prefix_and_postfix
      opts = FieldOptions.new(prefix: "€", postfix: ",-")
      assert_equal "€", opts.prefix
      assert_equal ",-", opts.postfix
    end

    def test_accepts_text_align
      opts = FieldOptions.new(text_align: "right")
      assert_equal "right", opts.text_align
    end

    def test_accepts_target
      opts = FieldOptions.new(target: "blank")
      assert_equal "blank", opts.target
    end

    def test_target_choices_match_link_action_parameters
      assert_equal Habarico::LinkActionParameters.find_enum_attr(:target).keys,
                   FieldOptions.find_enum_attr(:target).keys
    end

    def test_accepts_dynamic_render
      dr = DynamicRenderOptions.new(show_query: "status == 'active'")
      opts = FieldOptions.new(dynamic_render: dr)
      assert_equal dr, opts.dynamic_render
    end

    def test_accepts_relation
      relation = RelationFieldOptions.new(show_link: true)
      opts = FieldOptions.new(relation: relation)
      assert_equal relation, opts.relation
    end

    def test_accepts_phone
      phone = PhoneFieldOptions.new(default_region: 'CZ', allowed_regions: %w[CZ SK DE])
      opts = FieldOptions.new(phone: phone)
      assert_equal phone, opts.phone
    end

    def test_accepts_choices
      choices = ChoicesFieldOptions.new(icons_key: "status_icons")
      opts = FieldOptions.new(choices: choices)
      assert_equal choices, opts.choices
      assert_equal "status_icons", opts.choices.icons_key
    end

    def test_accepts_image
      image = ImageFieldOptions.new(resize_width: 800, crop_aspect_ratio: "16:9")
      opts = FieldOptions.new(image: image)
      assert_equal image, opts.image
      assert_equal 800, opts.image.resize_width
      assert_equal "16:9", opts.image.crop_aspect_ratio
    end

    def test_accepts_ai
      ai = AiFieldOptions.new(source_fields: %w[title body])
      opts = FieldOptions.new(ai: ai)
      assert_equal ai, opts.ai
      assert_equal %w[title body], opts.ai.source_fields
    end

    def test_defaults_are_nil
      opts = FieldOptions.new
      assert_nil opts.relation
      assert_nil opts.phone
      assert_nil opts.choices
      assert_nil opts.image
      assert_nil opts.ai
    end

  end
end
