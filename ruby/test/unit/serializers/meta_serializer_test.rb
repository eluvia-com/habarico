require "test_helper"

module Habarico
  module Serializers
    class MetaSerializerTest < Minitest::Test

      SCHEMA = {
        'name' => 'article',
        'label' => 'Article',
        'pk_field_name' => 'id',
        'actions' => %w[show edit]
      }.freeze

      def data(overrides = {})
        {
          'repr' => 'Article #1',
          'schema' => SCHEMA,
          'tags' => %w[featured],
          'trigger_action' => nil
        }.merge(overrides)
      end

      # ***********************************************************************
      # Without fields / default behaviour
      # ***********************************************************************

      def test_serialize_without_fields_returns_full_meta
        serializer = MetaSerializer.new

        assert_equal(data, serializer.serialize(data))
      end

      def test_serialize_without_fields_keeps_trigger_action_nil
        serializer = MetaSerializer.new

        assert_nil(serializer.serialize(data)['trigger_action'])
      end

      # ***********************************************************************
      # Top-level meta selection
      # ***********************************************************************

      def test_serialize_with_fields_returns_requested_subset
        serializer = MetaSerializer.new

        assert_equal({ 'repr' => 'Article #1' }, serializer.serialize(data, fields: 'repr'))
      end

      def test_serialize_with_multiple_fields_returns_requested_subset
        serializer = MetaSerializer.new

        assert_equal(
          { 'repr' => 'Article #1', 'tags' => %w[featured] },
          serializer.serialize(data, fields: 'repr,tags')
        )
      end

      def test_serialize_with_all_fields_wildcard_returns_every_readable_field
        serializer = MetaSerializer.new

        assert_equal(data, serializer.serialize(data, fields: '__all__'))
      end

      def test_serialize_with_unknown_top_level_field_raises_unprocessable_entity
        serializer = MetaSerializer.new

        error = assert_raises(Eluvia::Errors::UnprocessableEntity) do
          serializer.serialize(data, fields: 'bogus')
        end
        assert_equal(['bogus'], error.messages.keys)
      end

      # ***********************************************************************
      # Nested meta.schema selection
      # ***********************************************************************

      def test_serialize_with_schema_without_subfields_returns_full_schema
        serializer = MetaSerializer.new

        assert_equal(SCHEMA, serializer.serialize(data, fields: 'schema')['schema'])
      end

      def test_serialize_with_schema_subfields_returns_requested_subset
        serializer = MetaSerializer.new

        assert_equal(
          { 'name' => 'article', 'label' => 'Article' },
          serializer.serialize(data, fields: 'schema(name,label)')['schema']
        )
      end

      def test_serialize_with_schema_all_fields_wildcard_returns_full_schema
        serializer = MetaSerializer.new

        assert_equal(SCHEMA, serializer.serialize(data, fields: 'schema(__all__)')['schema'])
      end

      def test_serialize_with_schema_unknown_subfield_raises_unprocessable_entity
        serializer = MetaSerializer.new

        error = assert_raises(Eluvia::Errors::UnprocessableEntity) do
          serializer.serialize(data, fields: 'schema(bogus)')
        end
        assert_equal(['bogus'], error.messages.keys)
      end

      def test_serialize_combines_top_level_and_nested_selection
        serializer = MetaSerializer.new

        assert_equal(
          { 'repr' => 'Article #1', 'schema' => { 'name' => 'article' } },
          serializer.serialize(data, fields: 'repr,schema(name)')
        )
      end

    end
  end
end
