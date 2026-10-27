require "test_helper"

module Habarico
  class FilterParamsTest < Minitest::Test

    # Same `field=<json>` grammar as the base library, lenient like `raise_on_invalid: false`.
    class FilterableModel
      def self.primary_key
        'id'
      end

      def self.permitted_filter_params
        %i[id id__in title status]
      end

      def self.parse_filter_term(term, raise_on_invalid: true) # rubocop:disable Lint/UnusedMethodArgument -- keyword name must match the real parse_filter_term interface
        term.to_s.split('&').to_h do |t|
          field, raw = t.split('=', 2)
          [field, decode(raw)]
        end
      end

      def self.decode(raw)
        JSON.parse(raw)
      rescue JSON::ParserError
        raw
      end
    end

    def definition
      Habarico::Definition.new.tap do |d|
        d.model = FilterableModel
        d.filters = %i[title]
      end
    end

    def parse(params, read_allowed: true)
      FilterParams.new(definition, ActionController::Parameters.new(params), read_allowed: read_allowed)
    end

    def test_passes_offered_filters_through
      assert_equal({ title: 'Mug', id__in: '1' }, parse({ title: 'Mug', id__in: '1' }).filters)
    end

    def test_rejects_a_direct_param_the_resource_does_not_offer
      assert_raises(Eluvia::Errors::UnprocessableEntity) { parse({ status: 'paid' }) }
    end

    def test_rejects_a_filter_term_the_resource_does_not_offer
      assert_raises(Eluvia::Errors::UnprocessableEntity) { parse({ filter: 'title="Mug"&status="paid"' }) }
    end

    def test_ignores_params_that_are_no_filters
      assert_equal({}, parse({ order_by: 'title:asc', limit: '10' }).filters)
    end

    def test_extracts_the_search_from_the_direct_param
      result = parse({ search: 'mug', title: 'Mug' })
      assert_equal 'mug', result.search_query
      assert_equal({ title: 'Mug' }, result.filters)
    end

    def test_extracts_the_search_from_the_filter_string
      result = parse({ filter: 'search="mug"&title="Mug"' })
      assert_equal 'mug', result.search_query
      assert_equal({ filter: 'title="Mug"' }, result.filters)
    end

    def test_keeps_only_id_in_without_read_permission
      result = parse({ filter: 'id__in=[1,3]&title="Mug"&search="mug"' }, read_allowed: false)
      assert_equal({ id__in: [1, 3] }, result.filters)
      assert_nil result.search_query
    end

    def test_matches_nothing_without_ids_and_read_permission
      assert_equal({ id__in: [] }, parse({ title: 'Mug' }, read_allowed: false).filters)
    end

    def test_blank_search_is_no_search
      assert_nil parse({ search: '   ' }).search_query
    end

    def test_search_term_that_is_not_json_is_taken_verbatim
      assert_equal 'm"ug', parse({ filter: 'search=m"ug' }).search_query
    end

    def test_search_term_that_is_a_json_number_becomes_a_string
      assert_equal '5', parse({ filter: 'search=5' }).search_query
    end

    def test_direct_search_takes_precedence_over_the_filter_string
      assert_equal 'direct', parse({ search: 'direct', filter: 'search="embedded"' }).search_query
    end

    def test_filter_key_is_dropped_when_only_the_search_was_in_it
      assert_equal({}, parse({ filter: 'search="mug"' }).filters)
    end

    def test_other_filter_terms_are_left_verbatim
      assert_equal({ filter: 'title="Mug"&id=5' }, parse({ filter: 'title="Mug"&search="mug"&id=5' }).filters)
    end

  end
end
