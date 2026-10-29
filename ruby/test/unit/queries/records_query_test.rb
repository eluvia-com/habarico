require "test_helper"

module Habarico
  class RecordsQueryTest < Minitest::Test

    # Relation double recording every call made on it, in order.
    class RecordingRelation
      attr_reader :calls

      def initialize(calls = [])
        @calls = calls
      end

      def record(*call)
        @calls << call
        self
      end

      def published = record(:published)
      def filter_2!(params, current_user: nil) = record(:filter_2!, params, current_user)
      def filter_2(params, current_user: nil) = record(:filter_2, params, current_user)
      def includes(*names) = record(:includes, *names)
      def order_2(order_by) = record(:order_2, order_by)
      def page(page) = record(:page, page)
      def per(limit) = record(:per, limit)
      def padding(padding) = record(:padding, padding)
      def only_mine = record(:only_mine)

      def find(pk)
        record(:find, pk)
        pk
      end
    end

    def setup
      @relation = RecordingRelation.new
      relation = @relation
      @model = Class.new { define_singleton_method(:all) { relation } }
      @context = Habarico::Context.new(current_user: :alice)
    end

    def definition(**attrs)
      Habarico::Definition.new.tap do |d|
        d.model = @model
        attrs.each { |name, value| d.public_send("#{name}=", value) }
      end
    end

    def list(definition, filters = { title: 'Mug' })
      RecordsQuery.new(definition, @context).list(filters, search_query: nil, order_by: { 'id' => :asc }, page: 2, limit: 10, padding: 0)
    end

    def test_list_runs_the_whole_pipeline_in_order
      definition = definition(
        policy_scope: ->(records, _context) { records.only_mine },
        scopes: %i[published missing_scope],
        default_filter: { status: 'active' },
        includes: %i[category]
      )

      list(definition)

      assert_equal [
        [:only_mine],
        [:published],
        [:filter_2!, { title: 'Mug' }, :alice],
        [:filter_2, { status: 'active' }, :alice],
        %i[includes category],
        [:order_2, { 'id' => :asc }],
        [:page, 2],
        [:per, 10],
        [:padding, 0]
      ], @relation.calls
    end

    def test_list_skips_what_the_resource_does_not_declare
      list(definition)

      assert_equal %i[filter_2! order_2 page per padding], @relation.calls.map(&:first)
    end

    def test_filtered_stops_before_includes_ordering_and_pagination
      definition = definition(scopes: %i[published], default_filter: { status: 'active' }, includes: %i[category])

      RecordsQuery.new(definition, @context).filtered({ title: 'Mug' }, search_query: nil)

      assert_equal %i[published filter_2! filter_2], @relation.calls.map(&:first)
    end

    def test_list_hands_the_page_to_prefetch
      prefetched = nil
      list(definition(prefetch: ->(records) { prefetched = records }))

      assert_same @relation, prefetched
    end

    def test_find_applies_policy_scope_and_default_filter
      definition = definition(policy_scope: ->(records, _context) { records.only_mine }, default_filter: { status: 'active' })

      assert_equal '7', RecordsQuery.new(definition, @context).find('7')
      assert_equal [[:only_mine], [:filter_2, { status: 'active' }, :alice], [:find, '7']], @relation.calls
    end

  end
end
