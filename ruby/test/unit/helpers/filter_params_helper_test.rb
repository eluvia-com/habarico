require 'test_helper'

module Habarico
  class FilterParamsHelperTest < Minitest::Test

    Helper = Habarico::FilterParamsHelper

    # --- extract: direct param ------------------------------------------------

    def test_extract_from_direct_param
      assert_equal 'alpha', Helper.extract({ search: 'alpha' }, :search)
    end

    def test_extract_direct_param_blank_is_nil
      assert_nil Helper.extract({ search: '   ' }, :search)
    end

    def test_extract_absent_is_nil
      assert_nil Helper.extract({ filter: 'status="draft"' }, :search)
    end

    # --- extract: from the :filter string ------------------------------------

    def test_extract_from_filter_string_strips_json_quotes
      assert_equal 'alpha', Helper.extract({ filter: 'search="alpha"&status="draft"' }, :search)
    end

    def test_extract_falls_back_to_raw_on_invalid_json
      # `search=al"pha` is not valid JSON - the raw text is used verbatim instead of raising.
      assert_equal 'al"pha', Helper.extract({ filter: 'search=al"pha' }, :search)
    end

    def test_extract_coerces_non_string_json_to_string
      assert_equal '5', Helper.extract({ filter: 'search=5' }, :search)
    end

    def test_extract_direct_param_takes_precedence_over_filter_string
      assert_equal 'direct', Helper.extract({ search: 'direct', filter: 'search="embedded"' }, :search)
    end

    # --- extract: generic over the term name ---------------------------------

    def test_extract_is_generic_over_key
      assert_equal 'draft', Helper.extract({ filter: 'search="alpha"&status="draft"' }, :status)
    end

    # --- strip ----------------------------------------------------------------

    def test_strip_removes_direct_key
      out = Helper.strip({ search: 'alpha', status: 'draft' }, :search)

      refute out.key?(:search)
      assert_equal 'draft', out[:status]
    end

    def test_strip_removes_term_from_filter_string
      out = Helper.strip({ filter: 'search="alpha"&status="draft"' }, :search)

      assert_equal 'status="draft"', out[:filter]
    end

    def test_strip_drops_filter_key_when_nothing_remains
      out = Helper.strip({ filter: 'search="alpha"' }, :search)

      refute out.key?(:filter)
    end

    def test_strip_leaves_other_terms_verbatim
      out = Helper.strip({ filter: 'status="draft"&count=5' }, :search)

      assert_equal 'status="draft"&count=5', out[:filter]
    end

    def test_strip_is_generic_over_key
      out = Helper.strip({ filter: 'search="alpha"&status="draft"' }, :status)

      assert_equal 'search="alpha"', out[:filter]
    end

  end
end
