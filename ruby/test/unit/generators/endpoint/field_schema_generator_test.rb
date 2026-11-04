require "test_helper"
require "active_storage_validations"

module Habarico
  class FieldSchemaGeneratorFileArrayTest < Minitest::Test

    class Product
      include ::ActiveModel::Model
      include Eluvia::ActiveModel::Attributes
      include Eluvia::ActiveRecord::FileArrayAttribute

      def self.name
        "Product"
      end

      file_array_attr :gallery, underlying_attachments: :gallery_files, nature: :image, append_only: true, declare: true
      file_array_attr :manuals, underlying_attachments: :manual_files, append_only: true, declare: true
      file_array_attr :documents, underlying_attachments: :document_files, declare: true

      # One attachment shared by an image and a file array is validated for both kinds of file.
      def self.validators_on(attr_name)
        return [] unless attr_name.to_sym == :gallery_files

        [
          ::ActiveStorageValidations::ContentTypeValidator.new(attributes: [:gallery_files], in: %w[image/png image/jpeg application/pdf]),
          ::ActiveStorageValidations::SizeValidator.new(attributes: [:gallery_files], less_than_or_equal_to: 2_000)
        ]
      end
    end

    def setup
      @definition = Definition.new
      @definition.model = Product
      @generator = FieldSchemaGenerator.new(@definition, "products")
    end

    # ***********************************************************************
    # Append-only file array
    # ***********************************************************************

    def test_append_only_image_array_items_are_base64_images
      schema = @generator.generate(Product, :gallery)

      assert_equal "array", schema.type
      assert_nil schema.format
      assert_equal "object", schema.items.type
      assert_equal "base64-image", schema.items.format
      assert_equal(%w[type url filename size content], schema.items.properties.map { |property| property.name.to_s })
    end

    def test_append_only_file_array_items_are_base64_files
      assert_equal "base64-file", @generator.generate(Product, :manuals).items.format
    end

    def test_upload_options_are_on_items_only
      schema = @generator.generate(Product, :gallery)

      assert_nil schema.options
      assert_equal 2_000, schema.items.options.max_size
    end

    def test_image_array_accepts_only_image_types_of_the_attachment
      assert_equal %w[image/png image/jpeg], @generator.generate(Product, :gallery).items.options.accept
    end

    def test_field_reference_options_go_to_items
      field_reference = FieldReference.new(name: :gallery, resize_width: 1600, max_size: 500, accept: [".png"])
      options = @generator.generate(Product, :gallery, field_reference: field_reference).items.options

      assert_equal 1600, options.image.resize_width
      assert_equal 500, options.max_size
      assert_equal [".png"], options.accept
    end

    def test_subfields_are_ignored_for_append_only_array
      schema = @generator.generate(Product, :gallery, subfields: [:id, { file: %i[filename content] }])

      assert_equal "base64-image", schema.items.format
      assert_equal(%w[type url filename size content], schema.items.properties.map { |property| property.name.to_s })
    end

    # ***********************************************************************
    # Default file array
    # ***********************************************************************

    def test_default_file_array_items_stay_wrapper_objects
      schema = @generator.generate(Product, :documents, subfields: [:id, { file: %i[filename url] }])

      assert_equal "object", schema.items.type
      assert_nil schema.items.format
      assert_equal(%w[id file], schema.items.properties.map { |property| property.name.to_s })
    end

  end
end
