require "test_helper"

module Habarico
  module Serializers
    class RecordSerializerTest < Minitest::Test

      META = {
        'repr' => 'Article #1',
        'schema' => { 'name' => 'article', 'label' => 'Article', 'pk_field_name' => 'id', 'actions' => [] },
        'tags' => [],
        'trigger_action' => nil
      }.freeze

      def record(attrs = {})
        Struct.new(*attrs.keys).new(*attrs.values)
      end

      def build_record_serializer(fields: %w[id name])
        definition = Definition.new
        definition.model = Object.new
        definition.fields = fields
        RecordSerializer.new(serializer: Serializer.new(definition), meta_serializer: MetaSerializer.new)
      end

      # ***********************************************************************
      # Without fields / default behaviour
      # ***********************************************************************

      def test_serialize_without_fields_includes_data_and_full_meta
        record_serializer = build_record_serializer
        result = record_serializer.serialize(record(id: 1, name: "Alice"), META)

        assert_equal({ "id" => 1, "name" => "Alice", "meta" => META }, result)
      end

      def test_serialize_skips_field_record_does_not_respond_to
        record_serializer = build_record_serializer(fields: %w[id ghost])
        result = record_serializer.serialize(record(id: 1), META)

        assert_equal({ "id" => 1, "meta" => META }, result)
      end

      # ***********************************************************************
      # `fields` param governs `meta` the same way as any other top-level field
      # ***********************************************************************

      def test_serialize_with_explicit_fields_excludes_meta_when_not_requested
        record_serializer = build_record_serializer
        result = record_serializer.serialize(record(id: 1, name: "Alice"), META, fields: "id,name")

        assert_equal({ "id" => 1, "name" => "Alice" }, result)
      end

      def test_serialize_with_meta_requested_alongside_data_fields_returns_full_meta
        record_serializer = build_record_serializer
        result = record_serializer.serialize(record(id: 1, name: "Alice"), META, fields: "id,meta")

        assert_equal({ "id" => 1, "meta" => META }, result)
      end

      def test_serialize_with_default_fields_wildcard_keeps_meta
        record_serializer = build_record_serializer
        result = record_serializer.serialize(record(id: 1, name: "Alice"), META, fields: "__default__")

        assert_equal({ "id" => 1, "name" => "Alice", "meta" => META }, result)
      end

      def test_serialize_with_all_fields_wildcard_keeps_meta
        record_serializer = build_record_serializer
        result = record_serializer.serialize(record(id: 1, name: "Alice"), META, fields: "__all__")

        assert_equal({ "id" => 1, "name" => "Alice", "meta" => META }, result)
      end

      # ***********************************************************************
      # Nested `meta(...)` narrows the meta content, same as MetaSerializer
      # ***********************************************************************

      def test_serialize_with_nested_meta_fieldset_narrows_meta_and_excludes_data_fields
        record_serializer = build_record_serializer
        result = record_serializer.serialize(record(id: 1, name: "Alice"), META, fields: "meta(repr)")

        assert_equal({ "meta" => { "repr" => "Article #1" } }, result)
      end

      def test_serialize_with_nested_meta_fieldset_alongside_data_fields
        record_serializer = build_record_serializer
        result = record_serializer.serialize(record(id: 1, name: "Alice"), META, fields: "id,meta(repr,tags)")

        assert_equal({ "id" => 1, "meta" => { "repr" => "Article #1", "tags" => [] } }, result)
      end

      # ***********************************************************************
      # Validation
      # ***********************************************************************

      def test_serialize_with_unknown_top_level_field_raises_unprocessable_entity
        record_serializer = build_record_serializer
        error = assert_raises(Eluvia::Errors::UnprocessableEntity) do
          record_serializer.serialize(record(id: 1, name: "Alice"), META, fields: "bogus")
        end
        assert_equal(["bogus"], error.messages.keys)
      end

      def test_serialize_with_unknown_nested_meta_field_raises_unprocessable_entity
        record_serializer = build_record_serializer
        error = assert_raises(Eluvia::Errors::UnprocessableEntity) do
          record_serializer.serialize(record(id: 1, name: "Alice"), META, fields: "meta(bogus)")
        end
        assert_equal(["bogus"], error.messages.keys)
      end

    end
  end
end
