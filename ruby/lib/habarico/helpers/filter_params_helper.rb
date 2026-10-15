module Habarico
  # Parsing of the list-endpoint filter params. A named term can arrive either as a direct param
  # (`{ search: 'x' }`) or embedded in the `:filter` string as a `&`-separated `field=<json>`
  # term (`{ filter: 'search="x"&status="y"' }`). These helpers read or remove a single named term
  # from either form without disturbing the others; the grammar mirrors the base library
  # `parse_filter_term`, but stays lenient (never raises) since it only pre-processes params.
  module FilterParamsHelper

    # The decoded value of `key`, from the direct param or the `:filter` string; nil when absent or
    # blank. Filter-string values are JSON-encoded (`search="x"`), so quotes are stripped; a value
    # that is not valid JSON falls back to its raw text.
    def self.extract(filter_params, key)
      key = key.to_s
      direct = filter_params[key.to_sym]
      return direct.to_s if direct.present?

      filter_string = filter_params[:filter]
      return nil if filter_string.blank?

      term = filter_string.to_s.split('&').find { |t| term_field(t) == key }
      return nil if term.nil?

      parse_value(term.split('=', 2)[1].to_s.strip).to_s.presence
    end

    # `filter_params` with `key` removed from both the direct param and the `:filter` string (the
    # `:filter` key is dropped entirely when no other term remains). Other terms are left verbatim.
    def self.strip(filter_params, key)
      key = key.to_s
      result = filter_params.except(key.to_sym)
      return result if result[:filter].blank?

      remaining = result[:filter].to_s.split('&').reject { |t| term_field(t) == key }
      remaining.empty? ? result.except(:filter) : result.merge(filter: remaining.join('&'))
    end

    # The field name of a `field=<json>` term.
    def self.term_field(term)
      term.to_s.split('=', 2).first.to_s.strip
    end

    # JSON-decodes a raw filter value, falling back to the raw string when it is not valid JSON.
    def self.parse_value(raw)
      JSON.parse(raw)
    rescue JSON::ParserError, TypeError
      raw
    end
  end
end
