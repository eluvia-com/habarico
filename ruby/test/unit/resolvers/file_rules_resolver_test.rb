require "test_helper"
require "active_storage_validations"

module Habarico
  class FileRulesResolverTest < Minitest::Test

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

    class UnvalidatedModel < UploadableModel
      def self.name
        "UnvalidatedModel"
      end

      def self.validators_on(_attr_name)
        []
      end
    end

    class NoAttachmentModel
      def self.name
        "NoAttachmentModel"
      end

      def self.has_file_attr?(attr_name)
        attr_name.to_sym == :photo
      end

      def self.find_file_attr(_attr_name)
        { attr_name: :photo, underlying_attachment: nil, nature: :image }
      end
    end

    # ***********************************************************************
    # resolve
    # ***********************************************************************

    def test_nil_model_derives_none
      rules = FileRulesResolver.new(nil).resolve(:photo)
      assert_nil rules.allowed_content_types
      assert_nil rules.max_size
    end

    def test_non_file_attr_derives_none
      rules = FileRulesResolver.new(UnvalidatedModel).resolve(:not_a_file)
      assert_nil rules.allowed_content_types
      assert_nil rules.max_size
    end

    def test_attribute_without_underlying_attachment_derives_none
      rules = FileRulesResolver.new(NoAttachmentModel).resolve(:photo)
      assert_nil rules.allowed_content_types
      assert_nil rules.max_size
    end

    def test_field_without_validators_derives_none
      rules = FileRulesResolver.new(UnvalidatedModel).resolve(:photo)
      assert_nil rules.allowed_content_types
      assert_nil rules.max_size
    end

    def test_field_with_declared_validators_derives_both
      rules = FileRulesResolver.new(ValidatedModel).resolve(:photo)
      assert_equal %w[image/png image/jpeg], rules.allowed_content_types
      assert_equal 2_000, rules.max_size
    end

    def test_extension_shorthand_is_normalized_through_marcel
      klass = Class.new(UploadableModel) do
        def self.validators_on(attr_name)
          return [] unless attr_name.to_sym == :photo_attachment
          [::ActiveStorageValidations::ContentTypeValidator.new(attributes: [:photo_attachment], with: :png)]
        end
      end
      rules = FileRulesResolver.new(klass).resolve(:photo)
      assert_equal ["image/png"], rules.allowed_content_types
    end

    def test_regexp_content_type_is_kept_as_a_pattern
      klass = Class.new(UploadableModel) do
        def self.validators_on(attr_name)
          return [] unless attr_name.to_sym == :photo_attachment
          [::ActiveStorageValidations::ContentTypeValidator.new(attributes: [:photo_attachment], with: %r{\Aimage/.*\z})]
        end
      end
      rules = FileRulesResolver.new(klass).resolve(:photo)
      assert_equal 1, rules.allowed_content_types.size
      assert_kind_of Regexp, rules.allowed_content_types.first
    end

    def test_less_than_derives_an_inclusive_ceiling_one_byte_below
      klass = Class.new(UploadableModel) do
        def self.validators_on(attr_name)
          return [] unless attr_name.to_sym == :photo_attachment
          [::ActiveStorageValidations::SizeValidator.new(attributes: [:photo_attachment], less_than: 5_242_880)]
        end
      end
      rules = FileRulesResolver.new(klass).resolve(:photo)
      assert_equal 5_242_879, rules.max_size
    end

    def test_lower_bound_only_derives_no_ceiling
      klass = Class.new(UploadableModel) do
        def self.validators_on(attr_name)
          return [] unless attr_name.to_sym == :photo_attachment
          [::ActiveStorageValidations::SizeValidator.new(attributes: [:photo_attachment], greater_than: 1_000)]
        end
      end
      rules = FileRulesResolver.new(klass).resolve(:photo)
      assert_nil rules.max_size
    end

    # ***********************************************************************
    # FileRules#accept
    # ***********************************************************************

    def accept(allowed_content_types)
      FileRules.new(allowed_content_types: allowed_content_types).accept
    end

    def test_accept_maps_concrete_types
      assert_equal %w[image/png image/jpeg], accept(%w[image/png image/jpeg])
    end

    def test_accept_of_no_content_types_is_nil
      assert_nil accept(nil)
      assert_nil accept([])
    end

    def test_accept_drops_out_entirely_when_a_regexp_is_present
      assert_nil accept(["image/png", %r{\Aimage/.*\z}])
    end

  end
end
