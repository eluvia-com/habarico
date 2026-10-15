require 'test_helper'

module Habarico
  module Search
    class FieldResolverTest < Minitest::Test

      # -----------------------------------------------------------------------
      # Stub helpers
      #
      # The test suite has no real ActiveRecord; models are duck-typed stubs
      # exposing only the methods the resolver relies on (columns_hash,
      # reflect_on_association, has_enum_attr?, has_reference?/find_reference,
      # human_attribute_name).
      # -----------------------------------------------------------------------

      def column(type)
        col = Object.new
        col.define_singleton_method(:type) { type }
        col
      end

      def reflection(klass)
        ref = Object.new
        ref.define_singleton_method(:klass) { klass }
        ref
      end

      def build_model(columns: {}, associations: {}, enums: [], references: {}, labels: {})
        model = Object.new
        cols = columns.transform_keys(&:to_s).transform_values { |t| column(t) }
        assocs = associations
        enum_names = enums.map(&:to_sym)
        refs = references
        label_map = labels
        model.define_singleton_method(:columns_hash) { cols }
        model.define_singleton_method(:reflect_on_association) { |name| assocs[name.to_sym] }
        model.define_singleton_method(:has_enum_attr?) { |n| enum_names.include?(n.to_sym) }
        model.define_singleton_method(:has_reference?) { |n, **| refs.key?(n.to_sym) }
        model.define_singleton_method(:find_reference) { |n, **| refs[n.to_sym] }
        model.define_singleton_method(:human_attribute_name) { |n| label_map.fetch(n.to_sym, n.to_s) }
        model
      end

      # -----------------------------------------------------------------------
      # Simple leaf fields
      # -----------------------------------------------------------------------

      def test_resolves_text_column
        model = build_model(columns: { title: :string })
        leaf = FieldResolver.resolve(model, 'title')
        refute_nil leaf
        assert_equal model, leaf.model
        assert_equal 'title', leaf.name
        assert_equal 'title', leaf.path
        assert_equal :text, leaf.type
        assert leaf.text?
      end

      def test_resolves_text_column_from_symbol_path
        model = build_model(columns: { title: :text })
        leaf = FieldResolver.resolve(model, :title)
        refute_nil leaf
        assert_equal :text, leaf.type
      end

      def test_resolves_boolean_column
        model = build_model(columns: { active: :boolean })
        leaf = FieldResolver.resolve(model, 'active')
        assert_equal :boolean, leaf.type
        assert leaf.boolean?
      end

      def test_resolves_integer_column_as_numeric
        model = build_model(columns: { count: :integer })
        assert_equal :numeric, FieldResolver.resolve(model, 'count').type
      end

      def test_resolves_decimal_column_as_numeric
        model = build_model(columns: { price: :decimal })
        leaf = FieldResolver.resolve(model, 'price')
        assert_equal :numeric, leaf.type
        assert leaf.numeric?
      end

      def test_uuid_and_datetime_columns_are_text
        model = build_model(columns: { external_id: :uuid, created_at: :datetime })
        assert_equal :text, FieldResolver.resolve(model, 'external_id').type
        assert_equal :text, FieldResolver.resolve(model, 'created_at').type
      end

      def test_enum_field_is_choices
        model = build_model(columns: { status: :string }, enums: [:status])
        leaf = FieldResolver.resolve(model, 'status')
        assert_equal :choices, leaf.type
        assert leaf.choices?
      end

      def test_enum_takes_precedence_over_column_type
        # An enum backed by an integer column is still classified as choices.
        model = build_model(columns: { level: :integer }, enums: [:level])
        assert_equal :choices, FieldResolver.resolve(model, 'level').type
      end

      # -----------------------------------------------------------------------
      # Relation traversal
      # -----------------------------------------------------------------------

      def test_resolves_path_through_ar_association
        author = build_model(columns: { name: :string })
        model = build_model(associations: { author: reflection(author) })
        leaf = FieldResolver.resolve(model, 'author__name')
        refute_nil leaf
        assert_equal author, leaf.model
        assert_equal 'name', leaf.name
        assert_equal 'author__name', leaf.path
        assert_equal :text, leaf.type
      end

      def test_resolves_deep_path_three_levels
        country = build_model(columns: { code: :string })
        address = build_model(associations: { country: reflection(country) })
        author = build_model(associations: { address: reflection(address) })
        model = build_model(associations: { author: reflection(author) })
        leaf = FieldResolver.resolve(model, 'author__address__country__code')
        assert_equal country, leaf.model
        assert_equal 'code', leaf.name
        assert_equal :text, leaf.type
      end

      def test_resolves_path_through_attributes_model_reference
        author = build_model(columns: { name: :string })
        model = build_model(references: { author: { reference_name: :author, type: :has_one, class_name: author } })
        leaf = FieldResolver.resolve(model, 'author__name')
        refute_nil leaf
        assert_equal author, leaf.model
        assert_equal :text, leaf.type
      end

      # -----------------------------------------------------------------------
      # Invalid paths
      # -----------------------------------------------------------------------

      def test_unknown_leaf_field_returns_nil
        model = build_model(columns: { title: :string })
        assert_nil FieldResolver.resolve(model, 'missing')
      end

      def test_unknown_leaf_on_associated_model_returns_nil
        author = build_model(columns: { name: :string })
        model = build_model(associations: { author: reflection(author) })
        assert_nil FieldResolver.resolve(model, 'author__missing')
      end

      def test_non_relation_intermediate_hop_returns_nil
        model = build_model(columns: { title: :string, name: :string })
        # `title` is a plain column, not an association -> cannot be traversed.
        assert_nil FieldResolver.resolve(model, 'title__name')
      end

      def test_blank_path_segments_return_nil
        model = build_model(columns: { title: :string })
        assert_nil FieldResolver.resolve(model, 'title__')
        assert_nil FieldResolver.resolve(model, '__title')
        assert_nil FieldResolver.resolve(model, '')
      end

      def test_nil_model_or_path_returns_nil
        model = build_model(columns: { title: :string })
        assert_nil FieldResolver.resolve(nil, 'title')
        assert_nil FieldResolver.resolve(model, nil)
      end

      # -----------------------------------------------------------------------
      # resolve!
      # -----------------------------------------------------------------------

      def test_resolve_bang_returns_leaf_for_valid_path
        model = build_model(columns: { title: :string })
        assert_equal 'title', FieldResolver.resolve!(model, 'title').name
      end

      def test_resolve_bang_raises_for_invalid_path
        model = build_model(columns: { title: :string })
        assert_raises(ArgumentError) { FieldResolver.resolve!(model, 'missing') }
      end

      # -----------------------------------------------------------------------
      # Label
      # -----------------------------------------------------------------------

      def test_label_uses_human_attribute_name
        model = build_model(columns: { title: :string }, labels: { title: 'Headline' })
        assert_equal 'Headline', FieldResolver.resolve(model, 'title').label
      end

      def test_label_is_taken_from_leaf_model
        author = build_model(columns: { name: :string }, labels: { name: 'Author name' })
        model = build_model(associations: { author: reflection(author) })
        assert_equal 'Author name', FieldResolver.resolve(model, 'author__name').label
      end

    end
  end
end
