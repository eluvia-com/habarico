require "test_helper"
require "active_storage_validations"

module Habarico
  class FieldOptionsGeneratorTest < Minitest::Test

    class UploadableModel
      def self.name
        "UploadableModel"
      end

      def self.has_file_attr?(attr_name)
        attr_name.to_sym == :photo
      end

      def self.find_file_attr(_attr_name)
        { attr_name: :photo, underlying_attachment: :photo_attachment, nature: :image }
      end
    end

    # Same, with the `active_storage_validations` declarations a host puts on the underlying
    # attachment - the only source `max_size` / `accept` are derived from (HAB-966).
    class ValidatedModel < UploadableModel
      def self.name
        "ValidatedModel"
      end

      def self.validators_on(attr_name)
        return [] unless attr_name.to_sym == :photo_attachment

        [
          ::ActiveStorageValidations::ContentTypeValidator.new(attributes: [:photo_attachment], in: %w[image/png image/jpeg]),
          ::ActiveStorageValidations::SizeValidator.new(attributes: [:photo_attachment], less_than_or_equal_to: 2_000)
        ]
      end
    end

    def setup
      @definition = Definition.new
      @definition.model = nil
      @generator = FieldOptionsGenerator.new(@definition, "test_resource")
    end

    # ***********************************************************************
    # generate_max_size_at / generate_accept_at
    # ***********************************************************************

    def test_max_size_and_accept_derived_from_the_attachments_validators
      result = @generator.generate(ValidatedModel, :photo, nil)
      assert_equal 2_000, result.max_size
      assert_equal %w[image/png image/jpeg], result.accept
    end

    def test_no_max_size_or_accept_without_declared_validators
      result = @generator.generate(UploadableModel, :photo, nil)
      assert_nil result.max_size
      assert_nil result.accept
    end

    def test_no_max_size_or_accept_for_a_non_file_attr
      result = @generator.generate(ValidatedModel, :title, nil)
      assert_nil result.max_size
      assert_nil result.accept
    end

    # ***********************************************************************
    # generate_max_size_fr / generate_accept_fr
    # ***********************************************************************

    def test_max_size_and_accept_derived_via_a_field_reference
      fr = FieldReference.new(name: :photo)
      result = @generator.generate(ValidatedModel, nil, fr)
      assert_equal 2_000, result.max_size
      assert_equal %w[image/png image/jpeg], result.accept
    end

    # An explicit value set on the reference is a deliberate override, same as `resize_width` /
    # `icons_key` - it always wins over what the attachment's own validators imply.
    def test_explicit_max_size_and_accept_on_the_reference_win_over_the_derived_ones
      fr = FieldReference.new(name: :photo, max_size: 1, accept: ["application/pdf"])
      result = @generator.generate(ValidatedModel, nil, fr)
      assert_equal 1, result.max_size
      assert_equal ["application/pdf"], result.accept
    end

    # generate_max_size_at and generate_accept_at are independent generator methods called
    # separately for the same field - the derivation must be memoized so it only runs once.
    def test_derivation_is_memoized_across_max_size_and_accept
      calls = 0
      stubbed = lambda do |*_args|
        calls += 1
        FileValidations::Rules.new(allowed_content_types: %w[image/png], max_size: 2_000)
      end
      FileValidations.stub(:for_model, stubbed) do
        @generator.generate(ValidatedModel, :photo, nil)
      end
      assert_equal 1, calls
    end

    # ***********************************************************************
    # generate_choices_fr
    # ***********************************************************************

    def test_choices_returns_nil_when_icons_key_blank
      fr = FieldReference.new(name: "status")
      result = @generator.generate(nil, nil, fr)
      assert_nil result.choices
    end

    def test_choices_returns_choices_options_when_icons_key_present
      fr = FieldReference.new(name: "status", icons_key: "status_icons")
      result = @generator.generate(nil, nil, fr)
      assert_instance_of ChoicesFieldOptions, result.choices
      assert_equal "status_icons", result.choices.icons_key
    end

    # ***********************************************************************
    # generate_image_fr
    # ***********************************************************************

    def test_image_returns_nil_when_both_blank
      fr = FieldReference.new(name: "photo")
      result = @generator.generate(nil, nil, fr)
      assert_nil result.image
    end

    def test_image_returns_image_options_when_resize_width_present
      fr = FieldReference.new(name: "photo", resize_width: 800)
      result = @generator.generate(nil, nil, fr)
      assert_instance_of ImageFieldOptions, result.image
      assert_equal 800, result.image.resize_width
      assert_nil result.image.crop_aspect_ratio
    end

    def test_image_returns_image_options_when_crop_aspect_ratio_present
      fr = FieldReference.new(name: "photo", crop_aspect_ratio: "16:9")
      result = @generator.generate(nil, nil, fr)
      assert_instance_of ImageFieldOptions, result.image
      assert_nil result.image.resize_width
      assert_equal "16:9", result.image.crop_aspect_ratio
    end

    def test_image_returns_image_options_with_both_set
      fr = FieldReference.new(name: "photo", resize_width: 1200, crop_aspect_ratio: "4:3")
      result = @generator.generate(nil, nil, fr)
      assert_instance_of ImageFieldOptions, result.image
      assert_equal 1200, result.image.resize_width
      assert_equal "4:3", result.image.crop_aspect_ratio
    end

    # ***********************************************************************
    # generate_ai_fr
    # ***********************************************************************

    def test_ai_returns_nil_when_source_fields_blank
      fr = FieldReference.new(name: "summary")
      result = @generator.generate(nil, nil, fr)
      assert_nil result.ai
    end

    def test_ai_returns_ai_options_when_source_fields_present
      fr = FieldReference.new(name: "summary", ai_source_fields: %w[title body])
      result = @generator.generate(nil, nil, fr)
      assert_instance_of AiFieldOptions, result.ai
      assert_equal %w[title body], result.ai.source_fields
    end

    def test_ai_returns_ai_options_with_empty_source_fields_list
      fr = FieldReference.new(name: "summary", ai_source_fields: [])
      result = @generator.generate(nil, nil, fr)
      assert_nil result.ai
    end

    # ***********************************************************************
    # combined
    # ***********************************************************************

    def test_all_nested_options_set_together
      fr = FieldReference.new(
        name: "photo",
        icons_key: "status_icons",
        resize_width: 800,
        crop_aspect_ratio: "16:9",
        ai_source_fields: ["title"]
      )
      result = @generator.generate(nil, nil, fr)
      assert_instance_of ChoicesFieldOptions, result.choices
      assert_equal "status_icons", result.choices.icons_key
      assert_instance_of ImageFieldOptions, result.image
      assert_equal 800, result.image.resize_width
      assert_equal "16:9", result.image.crop_aspect_ratio
      assert_instance_of AiFieldOptions, result.ai
      assert_equal ["title"], result.ai.source_fields
    end

    def test_returns_nil_when_no_field_reference_and_no_attr_name
      result = @generator.generate(nil, nil, nil)
      assert_nil result
    end

  end
end
