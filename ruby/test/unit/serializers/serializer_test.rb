require "test_helper"
require "active_record"

module Habarico
  module Serializers
    class SerializerTest < Minitest::Test

      Reflection = Struct.new(:macro, :foreign_key)

      def plain_model
        Object.new
      end

      def ar_model(reflections: {}, enum_attrs: [])
        model = Object.new
        model.define_singleton_method(:ancestors) { [::ActiveRecord::Base] }
        model.define_singleton_method(:reflect_on_association) { |name| reflections[name.to_s] }
        model.define_singleton_method(:has_enum_attr?) { |name| enum_attrs.include?(name) }
        model
      end

      # Lightweight attribute-holder double, standing in for an ActiveRecord instance.
      def record(attrs = {})
        return Object.new if attrs.empty?

        Struct.new(*attrs.keys).new(*attrs.values)
      end

      def build_definition(model:, fields: [], read_only_fields: [])
        definition = Definition.new
        definition.model = model
        definition.fields = fields
        definition.read_only_fields = read_only_fields
        definition
      end

      # ***********************************************************************
      # Plain attributes / default_read_fields
      # ***********************************************************************

      def test_serialize_without_fields_returns_fields_and_read_only_fields
        definition = build_definition(model: plain_model, fields: %w[id name], read_only_fields: %w[created_at])
        serializer = Serializer.new(definition)
        record = record(id: 1, name: "Alice", created_at: "2026-01-01")

        assert_equal({ "id" => 1, "name" => "Alice", "created_at" => "2026-01-01" }, serializer.serialize(record))
      end

      def test_serialize_skips_field_record_does_not_respond_to
        definition = build_definition(model: plain_model, fields: %w[id ghost])
        serializer = Serializer.new(definition)
        record = record(id: 1)

        assert_equal({ "id" => 1 }, serializer.serialize(record))
      end

      def test_field_name_resolution_supports_string_symbol_hash_and_field_reference
        definition = build_definition(
          model: plain_model,
          fields: ["id", :name, { tags: { fields: "id" } }, FieldReference.new(name: "author")]
        )
        serializer = Serializer.new(definition)
        record = record(id: 1, name: "Alice", tags: %w[a b], author: "Bob")

        assert_equal(
          { "id" => 1, "name" => "Alice", "tags" => %w[a b], "author" => "Bob" },
          serializer.serialize(record)
        )
      end

      def test_field_name_resolution_raises_for_unsupported_field_type
        definition = build_definition(model: plain_model, fields: [42])
        serializer = Serializer.new(definition)

        assert_raises(Eluvia::Errors::StandardError) { serializer.serialize(record) }
      end

      # ***********************************************************************
      # Associations
      # ***********************************************************************

      def test_serialize_resolves_belongs_to_association_to_foreign_key
        model = ar_model(reflections: { "author" => Reflection.new(:belongs_to, "author_id") })
        definition = build_definition(model: model, fields: %w[id author])
        serializer = Serializer.new(definition)
        record = record(id: 1, author: record(id: 5), author_id: 5)

        assert_equal({ "id" => 1, "author" => 5 }, serializer.serialize(record))
      end

      def test_serialize_resolves_has_one_association_to_foreign_key
        model = ar_model(reflections: { "profile" => Reflection.new(:has_one, "profile_id") })
        definition = build_definition(model: model, fields: %w[id profile])
        serializer = Serializer.new(definition)
        record = record(id: 1, profile: record(id: 9), profile_id: 9)

        assert_equal({ "id" => 1, "profile" => 9 }, serializer.serialize(record))
      end

      def test_serialize_ignores_has_many_association
        model = ar_model(reflections: { "tags" => Reflection.new(:has_many, nil) })
        definition = build_definition(model: model, fields: %w[id tags])
        serializer = Serializer.new(definition)
        record = record(id: 1, tags: %w[a b])

        assert_equal({ "id" => 1, "tags" => %w[a b] }, serializer.serialize(record))
      end

      # ***********************************************************************
      # Nested fields grammar on relations (HAB-621) — grammar parses, but the
      # requested sub-fieldset is not applied: relations still serialize as
      # the flat foreign key, matching the "relation serialization is out of
      # scope" boundary from HAB-614/HAB-621.
      # ***********************************************************************

      def test_serialize_with_nested_fields_on_belongs_to_still_returns_flat_foreign_key
        model = ar_model(reflections: { "author" => Reflection.new(:belongs_to, "author_id") })
        definition = build_definition(model: model, fields: %w[id author])
        serializer = Serializer.new(definition)
        record = record(id: 1, author: record(id: 5), author_id: 5)

        assert_equal({ "id" => 1, "author" => 5 }, serializer.serialize(record, fields: "id,author(id,name)"))
      end

      def test_serialize_with_nested_wildcard_fields_on_belongs_to_still_returns_flat_foreign_key
        model = ar_model(reflections: { "author" => Reflection.new(:belongs_to, "author_id") })
        definition = build_definition(model: model, fields: %w[id author])
        serializer = Serializer.new(definition)
        record = record(id: 1, author: record(id: 5), author_id: 5)

        assert_equal({ "id" => 1, "author" => 5 }, serializer.serialize(record, fields: "id,author(__all__)"))
      end

      def test_serialize_with_deeply_nested_fields_on_belongs_to_does_not_raise
        model = ar_model(reflections: { "author" => Reflection.new(:belongs_to, "author_id") })
        definition = build_definition(model: model, fields: %w[id author])
        serializer = Serializer.new(definition)
        record = record(id: 1, author: record(id: 5), author_id: 5)

        assert_equal({ "author" => 5 }, serializer.serialize(record, fields: "author(id,manager(id,name))"))
      end

      def test_serialize_with_malformed_nested_fields_on_relation_raises_unprocessable_entity
        model = ar_model(reflections: { "author" => Reflection.new(:belongs_to, "author_id") })
        definition = build_definition(model: model, fields: %w[id author])
        serializer = Serializer.new(definition)

        error = assert_raises(Eluvia::Errors::UnprocessableEntity) do
          serializer.serialize(record(id: 1, author: record(id: 5), author_id: 5), fields: "author(")
        end
        assert_equal(["author("], error.messages.keys)
      end

      # ***********************************************************************
      # Enum attributes
      # ***********************************************************************

      def test_serialize_resolves_enum_attribute_to_value
        model = ar_model(enum_attrs: %w[status])
        definition = build_definition(model: model, fields: %w[id status])
        serializer = Serializer.new(definition)
        record = record(id: 1, status: 2, status_obj: { value: "active" })

        assert_equal({ "id" => 1, "status" => "active" }, serializer.serialize(record))
      end

      def test_serialize_resolves_enum_attribute_to_nil_when_no_enum_obj
        model = ar_model(enum_attrs: %w[status])
        definition = build_definition(model: model, fields: %w[id status])
        serializer = Serializer.new(definition)
        record = record(id: 1, status: nil, status_obj: nil)

        assert_equal({ "id" => 1, "status" => nil }, serializer.serialize(record))
      end

      # ***********************************************************************
      # fields param / fieldset resolution (delegated to Eluvia::Serializers::FieldsetSerializer)
      # ***********************************************************************

      def test_serialize_with_fields_returns_requested_subset
        definition = build_definition(model: plain_model, fields: %w[id name], read_only_fields: %w[created_at])
        serializer = Serializer.new(definition)
        record = record(id: 1, name: "Alice", created_at: "2026-01-01")

        assert_equal({ "name" => "Alice" }, serializer.serialize(record, fields: "name"))
      end

      def test_serialize_with_all_fields_wildcard_returns_every_readable_field
        definition = build_definition(model: plain_model, fields: %w[id name], read_only_fields: %w[created_at])
        serializer = Serializer.new(definition)
        record = record(id: 1, name: "Alice", created_at: "2026-01-01")

        assert_equal(
          { "id" => 1, "name" => "Alice", "created_at" => "2026-01-01" },
          serializer.serialize(record, fields: "__all__")
        )
      end

      def test_serialize_with_default_fields_wildcard_extends_defaults_with_extra_field
        definition = build_definition(model: plain_model, fields: %w[id], read_only_fields: %w[created_at internal])
        serializer = Serializer.new(definition)
        record = record(id: 1, created_at: "2026-01-01", internal: "secret")

        assert_equal(
          { "id" => 1, "created_at" => "2026-01-01", "internal" => "secret" },
          serializer.serialize(record, fields: "__default__,internal")
        )
      end

      def test_serialize_with_unknown_field_raises_unprocessable_entity
        definition = build_definition(model: plain_model, fields: %w[id name])
        serializer = Serializer.new(definition)

        error = assert_raises(Eluvia::Errors::UnprocessableEntity) do
          serializer.serialize(record(id: 1, name: "Alice"), fields: "bogus")
        end
        assert_equal(["bogus"], error.messages.keys)
      end

    end
  end
end
