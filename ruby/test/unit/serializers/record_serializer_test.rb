require "test_helper"
require "minitest/mock"

module Habarico
  module Serializers
    class RecordSerializerTest < Minitest::Test

      SCHEMA = { 'name' => 'article', 'label' => 'Article', 'pk_field_name' => 'id', 'actions' => [] }.freeze
      META = { 'repr' => 'Article #1', 'schema' => SCHEMA, 'tags' => [] }.freeze

      class Highlighter
        def initialize(**); end

        def highlight(_record, query, **)
          [{ name: 'name', value: "<mark>#{query}</mark>" }]
        end
      end

      def record(attrs = {})
        Struct.new(*attrs.keys) do
          def to_s = 'Article #1'
        end.new(*attrs.values)
      end

      # Adds a computed `summary` field the record itself has no method for.
      class SummarySerializer < FieldsSerializer
        def serializable?(record, field_name)
          field_name == 'summary' || super
        end

        def read_attribute(record, field_name)
          field_name == 'summary' ? "Summary of #{record.name}" : super
        end
      end

      def build_record_serializer(fields: nil, model_fields: %w[id name], trigger_action: nil, search_query: nil, serializer_class: FieldsSerializer)
        definition = Definition.new
        definition.model = Object.new
        definition.fields = model_fields
        definition.search_fields = %w[name]
        definition.fields_serializer = serializer_class
        RecordSerializer.new(
          definition: definition,
          resource_name: 'articles',
          context_for: ->(_record) {},
          trigger_action_schema_for: ->(_record) { trigger_action },
          fields: fields,
          search_query: search_query
        )
      end

      def serialize(view_type = :detail, schema: SCHEMA, attrs: { id: 1, name: 'Alice' }, **options)
        Habarico::SchemaService.instance.stub(:get_object_schema, schema) do
          build_record_serializer(**options).serialize(view_type, record(attrs))
        end
      end

      # ***********************************************************************
      # Without fields / default behaviour
      # ***********************************************************************

      def test_serialize_without_fields_includes_data_and_full_meta
        assert_equal({ "id" => 1, "name" => "Alice", "meta" => META }, serialize)
      end

      def test_serialize_skips_field_record_does_not_respond_to
        assert_equal({ "id" => 1, "meta" => META }, serialize(model_fields: %w[id ghost], attrs: { id: 1 }))
      end

      def test_fields_serializer_may_opt_a_computed_field_in
        result = serialize(model_fields: %w[id name summary], serializer_class: SummarySerializer)

        assert_equal 'Summary of Alice', result['summary']
      end

      # ***********************************************************************
      # `fields` param governs `meta` the same way as any other top-level field
      # ***********************************************************************

      def test_serialize_with_explicit_fields_excludes_meta_when_not_requested
        assert_equal({ "id" => 1, "name" => "Alice" }, serialize(fields: "id,name"))
      end

      def test_serialize_with_meta_requested_alongside_data_fields_returns_full_meta
        assert_equal({ "id" => 1, "meta" => META }, serialize(fields: "id,meta"))
      end

      def test_serialize_with_default_fields_wildcard_keeps_meta
        assert_equal({ "id" => 1, "name" => "Alice", "meta" => META }, serialize(fields: "__default__"))
      end

      def test_serialize_with_all_fields_wildcard_keeps_meta
        assert_equal({ "id" => 1, "name" => "Alice", "meta" => META }, serialize(fields: "__all__"))
      end

      # ***********************************************************************
      # Nested `meta(...)` narrows the meta content, same as MetaSerializer
      # ***********************************************************************

      def test_serialize_with_nested_meta_fieldset_narrows_meta_and_excludes_data_fields
        assert_equal({ "meta" => { "repr" => "Article #1" } }, serialize(fields: "meta(repr)"))
      end

      def test_serialize_with_nested_meta_fieldset_alongside_data_fields
        assert_equal({ "id" => 1, "meta" => { "repr" => "Article #1", "tags" => [] } }, serialize(fields: "id,meta(repr,tags)"))
      end

      # ***********************************************************************
      # Validation
      # ***********************************************************************

      def test_serialize_with_unknown_top_level_field_raises_unprocessable_entity
        error = assert_raises(Eluvia::Errors::UnprocessableEntity) { serialize(fields: "bogus") }
        assert_equal(["bogus"], error.messages.keys)
      end

      def test_serialize_with_unknown_nested_meta_field_raises_unprocessable_entity
        error = assert_raises(Eluvia::Errors::UnprocessableEntity) { serialize(fields: "meta(bogus)") }
        assert_equal(["bogus"], error.messages.keys)
      end

      # ***********************************************************************
      # meta.schema - snake_case like the rest of the response, compacted
      # ***********************************************************************

      def test_schema_keys_stay_snake_case
        schema = serialize(schema: {
          'name' => 'bank_transactions',
          'pk_field_name' => 'id',
          'actions' => [{ 'name' => 'detail', 'is_detail' => true, 'show_in_list' => true, 'show_in_detail' => true }]
        })['meta']['schema']

        assert_equal 'id', schema['pk_field_name']
        assert_equal({ 'name' => 'detail', 'is_detail' => true, 'show_in_list' => true, 'show_in_detail' => true }, schema['actions'].first)
      end

      def test_declared_view_parameters_reach_the_client_as_declared
        schema = serialize(schema: {
          'actions' => [{ 'name' => 'remind', 'view' => { 'dialog_width' => 'md', 'parameters' => { 'kind' => 'reminder', 'object_id' => 7 } } }]
        })['meta']['schema']

        assert_equal({ 'dialog_width' => 'md', 'parameters' => { 'kind' => 'reminder', 'object_id' => 7 } }, schema['actions'].first['view'])
      end

      def test_nil_and_empty_hash_values_are_dropped
        schema = serialize(schema: { 'name' => 'orders', 'label' => nil, 'actions' => [{ 'name' => 'detail', 'confirm_dialog' => {} }] })['meta']['schema']

        assert_equal({ 'name' => 'orders', 'actions' => [{ 'name' => 'detail' }] }, schema)
      end

      def test_trigger_action_is_compacted
        meta = serialize(trigger_action: { 'name' => 'show', 'label' => nil, 'view' => {} })['meta']

        assert_equal({ 'name' => 'show' }, meta['trigger_action'])
      end

      # ***********************************************************************
      # meta.highlights - list only, with an active search and a highlighter
      # ***********************************************************************

      def with_highlighter
        Habarico::Config.search_highlighter_class = Highlighter
        yield
      ensure
        Habarico::Config.search_highlighter_class = nil
      end

      def test_list_carries_highlights_of_an_active_search
        with_highlighter do
          assert_equal [{ name: 'name', value: '<mark>alice</mark>' }], serialize(:list, search_query: 'alice')['meta']['highlights']
        end
      end

      def test_highlights_survive_a_narrowed_meta_fieldset
        with_highlighter do
          assert_equal({ 'repr' => 'Article #1', 'highlights' => [{ name: 'name', value: '<mark>alice</mark>' }] },
                       serialize(:list, fields: 'meta(repr)', search_query: 'alice')['meta'])
        end
      end

      def test_detail_carries_no_highlights
        with_highlighter do
          refute serialize(:detail, search_query: 'alice')['meta'].key?('highlights')
        end
      end

    end
  end
end
