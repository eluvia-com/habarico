require_relative '../integration_helper'

module Habarico
  module Search
    class SearchMatcherTest < Minitest::Test

      def setup
        Article.delete_all
        Author.delete_all
        @author = Author.create!(name: 'Alice')
      end

      def matcher(fields, **opts)
        SearchMatcher.new(model: Article, search_fields: fields, **opts)
      end

      def ids(result)
        result.pluck(:id).sort
      end

      def test_text_field_icontains_match
        hit = Article.create!(title: 'Alpha article', content: 'body', status: 'draft', author: @author)
        Article.create!(title: 'Beta piece', content: 'body', status: 'draft', author: @author)

        result = matcher(%w[title]).apply(Article.all, 'alpha')

        assert_equal [hit.id], ids(result)
      end

      def test_blank_query_returns_scope_unchanged
        Article.create!(title: 'Alpha', content: 'body', status: 'draft', author: @author)

        assert_equal Article.all.count, matcher(%w[title]).apply(Article.all, '   ').count
      end

      def test_choices_field_matches_by_label
        published = Article.create!(title: 'One', content: 'b', status: 'published', author: @author)
        Article.create!(title: 'Two', content: 'b', status: 'draft', author: @author)

        result = matcher(%w[status]).apply(Article.all, 'Publ')

        assert_equal [published.id], ids(result)
      end

      def test_boolean_field_matches_yes
        active = Author.create!(name: 'Bob', active: true)
        Author.create!(name: 'Carol', active: false)
        a1 = Article.create!(title: 'x', content: 'b', status: 'draft', author: active)

        result = SearchMatcher.new(model: Article, search_fields: %w[author__active]).apply(Article.all, 'Yes')

        assert_equal [a1.id], ids(result)
      end

      def test_numeric_field_cast_icontains
        hit = Article.create!(title: 'x', content: 'b', status: 'draft', view_count: 421, author: @author)
        Article.create!(title: 'y', content: 'b', status: 'draft', view_count: 8, author: @author)

        result = matcher(%w[view_count]).apply(Article.all, '42')

        assert_equal [hit.id], ids(result)
      end

      def test_relation_traversal_text
        alice = @author
        bob = Author.create!(name: 'Bob')
        hit = Article.create!(title: 'x', content: 'b', status: 'draft', author: alice)
        Article.create!(title: 'y', content: 'b', status: 'draft', author: bob)

        result = SearchMatcher.new(model: Article, search_fields: %w[author__name]).apply(Article.all, 'Alice')

        assert_equal [hit.id], ids(result)
      end

      def test_or_across_multiple_fields
        a1 = Article.create!(title: 'needle here', content: 'b', status: 'draft', author: @author)
        a2 = Article.create!(title: 'x', content: 'needle inside', status: 'draft', author: @author)
        Article.create!(title: 'x', content: 'b', status: 'draft', author: @author)

        result = matcher(%w[title content]).apply(Article.all, 'needle')

        assert_equal [a1.id, a2.id].sort, ids(result)
      end

      def test_and_across_words
        hit = Article.create!(title: 'alpha bravo', content: 'b', status: 'draft', author: @author)
        Article.create!(title: 'alpha only', content: 'b', status: 'draft', author: @author)

        result = matcher(%w[title]).apply(Article.all, 'alpha bravo')

        assert_equal [hit.id], ids(result)
      end

      def test_unaccent_enabled_matches_diacritics
        hit = Article.create!(title: 'Crème brûlée', content: 'b', status: 'draft', author: @author)
        Article.create!(title: 'Plain', content: 'b', status: 'draft', author: @author)

        result = matcher(%w[title], unaccent: true).apply(Article.all, 'creme')

        assert_equal [hit.id], ids(result)
      end

      def test_unaccent_disabled_ignores_diacritics_query
        Article.create!(title: 'Crème brûlée', content: 'b', status: 'draft', author: @author)

        result = matcher(%w[title], unaccent: false).apply(Article.all, 'creme')

        assert_empty ids(result)
      end

    end
  end
end
