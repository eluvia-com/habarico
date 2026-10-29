require_relative '../integration_helper'
require 'action_controller'

module Habarico
  class ControllerSearchTest < Minitest::Test

    class TestArticlesController < ActionController::Base
      include Habarico::Controller

      model Article
      search_fields %w[title author__name]
    end

    def setup
      Article.delete_all
      Author.delete_all
      @author = Author.create!(name: 'Alice')
    end

    def highlights(article, search_query)
      Habarico::Serializers::RecordSerializer.new(
        definition: TestArticlesController.definition,
        resource_name: 'test_articles',
        context_for: ->(_record) {},
        trigger_action_schema_for: ->(_record) {},
        search_query: search_query
      ).highlights(article)
    end

    # Filter-string parsing itself (the two search transport forms, JSON decoding, term stripping)
    # is covered by FilterParamsResolverTest; here we only exercise the list highlights of `RecordSerializer`.
    #
    # Match highlighting is a paid feature (HAB-812): the free gem registers no highlighter, so
    # these tests cover the graceful degradation and the hook itself, while the highlighter's own
    # behaviour is tested in habarico-enterprise.

    # --- highlights: free core ------------------------------------

    def test_highlights_nil_without_registered_highlighter
      article = Article.create!(title: 'x', content: 'b', status: 'draft', author: @author)

      assert_nil Habarico::Config.search_highlighter_class
      assert_nil highlights(article, 'Alice')
    end

    def test_search_still_filters_without_a_highlighter
      Article.create!(title: 'Alpha', content: 'b', status: 'draft', author: @author)
      Article.create!(title: 'Beta', content: 'b', status: 'draft', author: @author)

      scope = Habarico::Search::SearchMatcher.new(
        model: Article,
        search_fields: %w[title author__name]
      ).apply(Article.all, 'Alpha')

      assert_equal ['Alpha'], scope.pluck(:title)
    end

    # --- highlights: with a registered highlighter ----------------

    # Stands in for habarico-enterprise's SearchHighlighter - the hook must accept any class with
    # this shape, which is what lets the paid gem plug in without the free gem knowing it.
    class StubHighlighter
      def initialize(search_fields:, **) = (@search_fields = search_fields)

      def highlight(record, query, **)
        @search_fields.filter_map do |field|
          next unless record.respond_to?(field)

          { name: field, value: "<mark>#{query}</mark>", label: field, offsets: [[0, query.length]] }
        end
      end
    end

    def test_registered_highlighter_is_used
      Habarico::Config.search_highlighter_class = StubHighlighter
      article = Article.create!(title: 'x', content: 'b', status: 'draft', author: @author)

      entries = highlights(article, 'Alice')

      assert_equal [{ name: 'title', value: '<mark>Alice</mark>', label: 'title', offsets: [[0, 5]] }], entries
    ensure
      Habarico::Config.search_highlighter_class = nil
    end

    def test_registered_highlighter_may_be_given_as_a_string
      Habarico::Config.search_highlighter_class =
        'Habarico::ControllerSearchTest::StubHighlighter'
      article = Article.create!(title: 'x', content: 'b', status: 'draft', author: @author)

      assert_equal 1, highlights(article, 'Alice').length
    ensure
      Habarico::Config.search_highlighter_class = nil
    end

    def test_highlights_nil_without_query
      article = Article.create!(title: 'x', content: 'b', status: 'draft', author: @author)

      assert_nil highlights(article, nil)
    end

    def test_highlights_nil_when_no_match
      article = Article.create!(title: 'x', content: 'b', status: 'draft', author: @author)

      assert_nil highlights(article, 'zzznomatch')
    end

  end
end
