require "test_helper"

module Habarico
  class OrderByParamsResolverTest < Minitest::Test

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

    def resolve(order_by, definition: build_definition, tiebreaker: [])
      OrderByParamsResolver.new(definition, tiebreaker: tiebreaker).resolve(ActionController::Parameters.new(order_by: order_by))
    end

    def test_returns_the_requested_field_names
      assert_equal %w[name price], resolve('name:asc,price:desc')
    end

    def test_no_order_by_requests_nothing
      assert_equal [], resolve(nil)
    end

    def test_rejects_every_unknown_field_at_once
      error = assert_raises(Eluvia::Errors::UnprocessableEntity) { resolve('secret:asc,name:asc,cost:desc') }

      assert_equal %w[order_by__cost order_by__secret], error.messages.keys.sort
    end

    def test_accepts_the_tiebreaker
      definition = build_definition(columns: %w[name price])

      assert_raises(Eluvia::Errors::UnprocessableEntity) { resolve('sku:asc', definition: definition) }
      assert_equal %w[sku], resolve('sku:asc', definition: definition, tiebreaker: [:sku])
    end

    def test_forced_sorting_ignores_the_parameter
      assert_equal [], resolve('secret:asc', definition: build_definition(force_sorting: 'name:asc'))
    end

  end
end
