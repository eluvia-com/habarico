require "test_helper"

module Habarico
  class OrderByValidatorTest < Minitest::Test

    Column = Struct.new(:type)

    def build_definition(columns: %w[id name price], force_sorting: nil)
      model = Class.new(ActiveRecord::Base)
      model.define_singleton_method(:name) { 'Product' }
      model.define_singleton_method(:columns_hash) { columns.index_with { |_column| Column.new(:string) } }
      model.define_singleton_method(:attribute_names) { columns }
      model.define_singleton_method(:reflect_on_association) { |_name| nil }

      Habarico::Definition.new.tap do |definition|
        definition.model = model
        definition.fields = %i[name price]
        definition.force_sorting = force_sorting
      end
    end

    def validate!(field_names, definition: build_definition)
      OrderByValidator.new(definition).validate!(field_names)
    end

    def test_accepts_the_fields_the_resource_sorts_by
      assert_nil validate!(%w[name price])
    end

    def test_accepts_no_fields
      assert_nil validate!([])
    end

    def test_rejects_every_unknown_field_at_once
      error = assert_raises(Eluvia::Errors::UnprocessableEntity) { validate!(%w[secret name cost]) }

      assert_equal %w[order_by__cost order_by__secret], error.messages.keys.sort
    end

    def test_accepts_the_primary_key
      definition = build_definition(columns: %w[sku name price])
      definition.model.define_singleton_method(:primary_key) { 'sku' }
      definition.fields = %i[name price]

      assert_nil validate!(%w[sku], definition: definition)
    end

    def test_forced_sorting_is_not_checked
      assert_nil validate!(%w[secret], definition: build_definition(force_sorting: 'name:asc'))
    end

  end
end
