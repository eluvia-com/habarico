module Habarico
  # The filter params of a list request, checked against the resource: the terms handed to
  # `filter_2!` and the fulltext search query, which Habarico applies itself.
  class FilterParams
    attr_reader :filters, :search_query

    # Raises `Eluvia::Errors::UnprocessableEntity` for a filter term the resource does not offer.
    def initialize(definition, params, read_allowed:)
      @definition = definition
      filter_params = permit(params).to_h.symbolize_keys

      if read_allowed
        # Habarico owns the typed fulltext search over `search_fields` (see SearchMatcher), so the
        # search term is pulled out and applied separately - it must not reach the base library
        # `filter_2!`, whose `apply_search` uses a different field list and always unaccents.
        @search_query = extract_search(filter_params)
        @filters = strip_search(filter_params)
      else
        @filters = ids_only(filter_params)
      end
    end

    private

    def permit(params)
      model = @definition.model
      pk = model.primary_key.to_sym
      filters = @definition.filters + [pk, :"#{pk}__in"]

      permitted_params = model.permitted_filter_params
      selected_params = permitted_params.select { |f| filters.include?(param_name(f)) }
      selected_keys = selected_params.map { |p| param_name(p) }

      disallowed = (params.keys.map(&:to_sym) & permitted_params.map { |p| param_name(p) }) - selected_keys - %i[filter search]
      raise_unknown_terms(disallowed) if disallowed.any?

      if params.key?(:filter)
        filter_term_keys = model.parse_filter_term(params[:filter].to_s, raise_on_invalid: false).symbolize_keys.keys
        disallowed_terms = filter_term_keys.map(&:to_sym) - selected_keys - [:search]
        raise_unknown_terms(disallowed_terms) if disallowed_terms.any?
      end

      params.permit(selected_params + %i[filter search])
    end

    # `allow_read_by_id` without read permission: only allow filtering by IDs, and set empty
    # result if no IDs provided. This supports references across multiple services with limited
    # permissions - a caller holding an ID(s) of the object may see its data, but not list all
    # objects (this is what `ReferenceField` on the frontend uses).
    def ids_only(filter_params)
      filter_params = @definition.model.parse_filter_term(filter_params[:filter].to_s, raise_on_invalid: false).symbolize_keys if filter_params.key?(:filter)
      { id__in: [] }.merge(filter_params.slice(:id__in))
    end

    # The search arrives either as a direct param (`{ search: 'x' }`) or embedded in the `:filter`
    # string as a `&`-separated `field=<json>` term (`{ filter: 'search="x"&title="y"' }`). The
    # grammar mirrors the base library `parse_filter_term`, but stays lenient (never raises).
    #
    # Returns the decoded query, nil when absent or blank; a value that is not valid JSON falls back
    # to its raw text.
    def extract_search(filter_params)
      direct = filter_params[:search]
      return direct.to_s if direct.present?
      return nil if filter_params[:filter].blank?

      term = filter_params[:filter].to_s.split('&').find { |t| search_term?(t) }
      return nil if term.nil?

      parse_value(term.split('=', 2)[1].to_s.strip).to_s.presence
    end

    # `filter_params` without the search in either form; the `:filter` key is dropped when no other
    # term remains, the other terms are left verbatim.
    def strip_search(filter_params)
      result = filter_params.except(:search)
      return result if result[:filter].blank?

      remaining = result[:filter].to_s.split('&').reject { |t| search_term?(t) }
      remaining.empty? ? result.except(:filter) : result.merge(filter: remaining.join('&'))
    end

    def search_term?(term)
      term.split('=', 2).first.to_s.strip == 'search'
    end

    def parse_value(raw)
      JSON.parse(raw)
    rescue JSON::ParserError, TypeError
      raw
    end

    def param_name(param)
      param.is_a?(Hash) ? param.keys.first : param.to_sym
    end

    def raise_unknown_terms(keys)
      errors = keys.to_h { |k| [k.to_s, I18n.t('habarico.errors.filter.unknown_term', default: 'Unknown filter term.')] }
      raise Eluvia::Errors::UnprocessableEntity.new(errors)
    end
  end
end
