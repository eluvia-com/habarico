require "test_helper"

module Habarico
  class RecordParamsResolverTest < Minitest::Test

    # Model double: `document` is a file_attr field, `price` an amount written as `price`,
    # `price_major` or `price_minor`.
    class ProductModel
      def self.has_file_attr?(field)
        field.to_sym == :document
      end

      def self.has_amount_attr?(field)
        field.to_s == 'price'
      end
    end

    # Record double carrying only validation errors.
    Record = Struct.new(:errors)
    Errors = Struct.new(:to_hash)

    def resolver
      definition = Habarico::Definition.new
      definition.model = ProductModel
      definition.fields = %i[notes document]
      RecordParamsResolver.new(definition)
    end

    def resolve(params)
      resolver.resolve(ActionController::Parameters.new(params))
    end

    # ***********************************************************************
    # resolve - scalar fields
    # ***********************************************************************

    def test_permits_scalar_fields
      permitted = resolve(notes: "hello", category_id: 9)
      assert_equal "hello", permitted[:notes]
      refute permitted.key?(:category_id)
    end

    # ***********************************************************************
    # resolve - file_attr fields (base64 / chunked upload)
    # ***********************************************************************

    def test_strips_hash_valued_file_field_without_nested_permit_spec
      # Regression baseline: a bare `permit(:document)` (no nested spec) silently drops any
      # Hash value - this is what the nested permit spec of a file_attr field prevents.
      params = ActionController::Parameters.new(document: { upload_key: "tmp/uploads/x/y.zip" })
      assert_nil params.permit(:document)[:document]
    end

    def test_permits_upload_key_for_file_attr_field
      permitted = resolve(notes: "hello", document: { upload_key: "tmp/uploads/x/y.zip" })
      assert_equal "tmp/uploads/x/y.zip", permitted[:document][:upload_key]
    end

    def test_permits_base64_content_for_file_attr_field
      permitted = resolve(document: { filename: "y.zip", content: "base64data" })
      assert_equal "y.zip", permitted[:document][:filename]
      assert_equal "base64data", permitted[:document][:content]
    end

    def test_does_not_permit_unlisted_keys_on_file_attr_field
      permitted = resolve(document: { upload_key: "tmp/uploads/x/y.zip", evil: "nope" })
      refute permitted[:document].key?(:evil)
    end

    # ***********************************************************************
    # resolve - append-only file_array_attr fields
    # ***********************************************************************

    class GalleryModel
      def self.has_file_array_attr?(field)
        %i[gallery documents].include?(field.to_sym)
      end

      def self.find_file_array_attr(field)
        { attr_name: field.to_sym, append_only: field.to_sym == :gallery }
      end
    end

    def resolve_gallery(params, fields:, write_only_fields: [])
      definition = Habarico::Definition.new
      definition.model = GalleryModel
      definition.fields = fields
      definition.write_only_fields = write_only_fields
      RecordParamsResolver.new(definition).resolve(ActionController::Parameters.new(params))
    end

    def gallery_params
      { gallery: [{ filename: "a.png", content: "base64data" }, { filename: "b.png", content: "more", evil: "nope" }] }
    end

    def test_permits_uploads_for_write_only_append_only_field
      permitted = resolve_gallery(gallery_params, fields: %i[name], write_only_fields: %i[gallery])

      assert_equal(%w[a.png b.png], permitted[:gallery].map { |file| file[:filename] })
      assert_equal "base64data", permitted[:gallery].first[:content]
      refute permitted[:gallery].last.key?(:evil)
    end

    def test_permits_uploads_for_append_only_field_declared_with_subfields
      permitted = resolve_gallery(gallery_params, fields: [:name, { gallery: [:id, { file: %i[filename url] }] }])

      assert_equal(%w[a.png b.png], permitted[:gallery].map { |file| file[:filename] })
    end

    def test_keeps_declared_subfields_for_default_file_array
      params = { documents: [{ id: "1", file: { filename: "a.txt", content: "data" } }] }
      permitted = resolve_gallery(params, fields: [{ documents: [:id, { file: %i[filename content] }] }])

      assert_equal "a.txt", permitted[:documents].first[:file][:filename]
    end

    # ***********************************************************************
    # validation_error
    # ***********************************************************************

    def validation_error(errors)
      resolver.validation_error(Record.new(Errors.new(errors)))
    end

    def test_validation_error_keeps_a_plain_attribute
      error = validation_error(notes: ["is too long"])

      assert_instance_of Eluvia::Errors::UnprocessableEntity, error
      assert_equal({ 'notes' => ["is too long"] }, error.messages)
    end

    def test_validation_error_repeats_an_amount_error_under_every_variant
      error = validation_error(price: ["must be positive"])

      assert_equal %w[price price_major price_minor], error.messages.keys
    end

  end
end
