require_relative '../integration_helper'
require 'action_controller'

module Habarico

  # End-to-end counterpart of `ControllerOrderByTest`: the unit test pins down what the validator
  # accepts, this one pins down that what it accepts survives the handover to the base library -
  # `Eluvia::PaginationHandler#set_pagination` parsing the parameter and
  # `Eluvia::ActiveRecord::Ordering#order_2` turning the result into SQL (HAB-915).
  class ControllerOrderingTest < Minitest::Test

    ActiveRecord::Schema.verbose = false
    ActiveRecord::Schema.define do
      create_table :habarico_ordering_records, force: true do |t|
        t.string :title
        t.integer :position
        t.datetime :valid_from
        t.datetime :valid_to
        t.datetime :created_at
        t.references :author
      end
    end

    # Duck-typed range attribute: `generate_sort_by` asks the model for `has_range_attr?` /
    # `find_range_attr` and offers the lower bound column as the sortable one. Mirrors the shape of
    # `Eluvia::ActiveModel::RangeAttribute` without mixing it into ActiveRecord (see FixtureEnum).
    module FixtureRange
      extend ActiveSupport::Concern

      class_methods do
        def range_attr(name, lower_attr_name, upper_attr_name)
          _range_attrs[name.to_sym] = {
            attr_name: name.to_sym,
            lower_attr_name: lower_attr_name.to_sym,
            upper_attr_name: upper_attr_name.to_sym
          }
        end

        def _range_attrs = @_range_attrs ||= {}
        def has_range_attr?(name) = _range_attrs.key?(name.to_sym)
        def find_range_attr(name) = _range_attrs[name.to_sym]
      end
    end

    class OrderingRecord < ActiveRecord::Base
      include Eluvia::ActiveRecord::Ordering
      include FixtureRange

      belongs_to :author, class_name: '::Author'

      range_attr :validity, :valid_from, :valid_to

      def validity = { lower: valid_from, upper: valid_to }
    end

    class RecordsController < ActionController::Base
      include Habarico::Controller

      model OrderingRecord
      fields %i[title validity]
      default_sorting 'title:asc'
      views [
        Habarico::ListView.new(boxes: [
                                 Habarico::FieldReference.new(name: 'title'),
                                 Habarico::FieldReference.new(name: 'author__name'),
                                 Habarico::FieldReference.new(name: 'position', sort_by: 'created_at'),
                               ])
      ]

      private

      def authenticate_request; end
    end

    def setup
      OrderingRecord.delete_all
      Author.delete_all
      @author = Author.create!(name: 'Alice')
    end

    # Runs the real `before_action` chain of the index action, so the order of `set_pagination`
    # and `validate_order_by_param` is exercised rather than assumed.
    def run_index_callbacks(params)
      controller = RecordsController.new
      controller.params = ActionController::Parameters.new(params)
      # The `:process_action` chain terminates on `performed?`, which reads the response.
      controller.set_response!(ActionDispatch::Response.new)
      controller.send(:action_name=, 'index')
      controller.run_callbacks(:process_action) { nil }
      controller
    end

    def order_by_for(params)
      run_index_callbacks(params).instance_variable_get(:@order_by)
    end

    # ***********************************************************************
    # Handover to set_pagination
    # ***********************************************************************

    # An empty parameter used to reach `set_pagination` and leave a `nil` column name behind,
    # which `order_2` then blew up on with a NoMethodError (HTTP 500).
    def test_blank_parameter_falls_back_to_the_default_sorting
      OrderingRecord.create!(title: 'A', author: @author)

      assert_equal({ 'title' => :asc, 'id' => :asc }, order_by_for(order_by: ''))
      assert_equal 1, OrderingRecord.order_2(order_by_for(order_by: '')).to_a.length
    end

    # `append_order_by_tiebreaker` leaves a field the ordering already names alone, so the
    # primary key tie-breaker does not silently turn an explicit `id:desc` into ascending.
    def test_explicit_direction_survives_the_tie_breaker
      assert_equal({ 'id' => :desc }, order_by_for(order_by: 'id:desc'))
    end

    # `set_pagination` does not strip the entries, so an unstripped value would reach `order_2` as
    # the column name ` created_at` and be refused there, past our own validation.
    def test_whitespace_between_entries_does_not_reach_the_base_parser
      assert_equal({ 'title' => :asc, 'created_at' => :desc, 'id' => :asc },
        order_by_for(order_by: 'title:asc, created_at:desc'))
    end

    def test_validated_parameter_orders_the_records
      OrderingRecord.create!(title: 'B', author: @author)
      OrderingRecord.create!(title: 'A', author: @author)

      records = OrderingRecord.order_2(order_by_for(order_by: 'title:asc'))

      assert_equal %w[A B], records.map(&:title)
    end

    # ***********************************************************************
    # force_sorting
    # ***********************************************************************

    class ForcedSortingController < RecordsController

      model OrderingRecord
      default_sorting 'title:asc'
      force_sorting true
    end

    # The parameter is ignored when sorting is forced, so it must not decide the tie-breaker either.
    def test_ignored_parameter_does_not_drop_the_tie_breaker
      controller = ForcedSortingController.new
      controller.params = ActionController::Parameters.new(order_by: 'created_at:desc')
      controller.set_response!(ActionDispatch::Response.new)
      controller.send(:action_name=, 'index')
      controller.run_callbacks(:process_action) { nil }

      assert_equal({ 'title' => :asc, 'id' => :asc },
        controller.instance_variable_get(:@order_by))
    end

    # ***********************************************************************
    # Sortable fields advertised by the schema
    # ***********************************************************************

    # `FieldDescriptorGenerator` offers `sort_by: "author__name"` for a list column named after an
    # association, and `order_2` knows how to join it - the validator must not refuse it first.
    def test_accepts_sorting_by_an_association_column_offered_by_the_schema
      OrderingRecord.create!(title: 'B', author: Author.create!(name: 'Zoe'))
      OrderingRecord.create!(title: 'A', author: @author)

      records = OrderingRecord.order_2(order_by_for(order_by: 'author__name:asc'))

      assert_equal %w[A B], records.map(&:title)
    end

    # `FieldSchemaGenerator` offers the lower bound column of a range attribute as its `sort_by`.
    def test_accepts_sorting_by_the_lower_bound_of_a_range_field
      assert_equal({ 'valid_from' => :desc, 'id' => :asc },
        order_by_for(order_by: 'valid_from:desc'))
    end

    # An explicit `sort_by` on a list column is the documented escape hatch for sorting by
    # something else than the column itself.
    def test_accepts_an_explicit_sort_by_of_a_list_column
      assert_equal({ 'created_at' => :asc, 'id' => :asc }, order_by_for(order_by: 'created_at:asc'))
    end

    # A real column the schema never offers for sorting stays refused.
    def test_rejects_a_column_the_schema_does_not_offer
      error = assert_raises(Eluvia::Errors::UnprocessableEntity) do
        order_by_for(order_by: 'author_id:asc')
      end
      assert_equal ['order_by__author_id'], error.messages.keys
    end

  end
end
