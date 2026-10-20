module Habarico
  module Config
    mattr_accessor :resources
    @@resources = []

    mattr_accessor :routing_url_prefix
    @@routing_url_prefix = ''

    mattr_accessor :routing_scope
    @@routing_scope = nil

    mattr_accessor :currency
    @@currency = 'CZK'

    # Enables diacritics-insensitive (unaccent) fulltext search matching and highlighting by
    # default. Mirrors the Python `SEARCH_UNACCENT_ENABLED` setting. Off by default; requires the
    # PostgreSQL `unaccent` extension when the matcher relies on it.
    mattr_accessor :search_unaccent_enabled
    @@search_unaccent_enabled = false

    # Parent class for Habarico's own engine controllers (schema/search endpoints). Defaults to a
    # plain API controller with no authentication. Set this to your app's own `'ApplicationController'`
    # to inherit its authentication before_actions instead of implementing `authenticate_method`
    # again for the engine controllers.
    mattr_accessor :base_controller_class
    @@base_controller_class = 'ActionController::API'

    # Page size of a list endpoint when the request sends no `limit`. `nil` (the default) leaves
    # the decision to `set_pagination` in eluvia-base, which paginates by 20. A resource overrides
    # this with `default_page_limit` in its DSL. Mirrors the Python `DEFAULT_PAGE_LIMIT` key of the
    # `ADMIN_REST_FRAMEWORK` settings block (HAB-946).
    mattr_accessor :default_page_limit
    @@default_page_limit = nil

    # Upper bound for the `limit` query parameter of a list endpoint; above it the request is
    # refused with 422. `nil` (the default) leaves the decision to
    # `Eluvia::Base::Config.max_page_limit` (1000), which is also the only place the bound can be
    # removed altogether - a resource declares a number or nothing at all. Mirrors the Python
    # `MAX_PAGE_LIMIT` key (HAB-946).
    mattr_accessor :max_page_limit
    @@max_page_limit = nil

    # Class building the `meta.highlights` payload of a search-filtered list response, as a class
    # or its name. `nil` by default - match highlighting is a paid feature, so the free gem ships
    # no highlighter and simply omits the key. `habarico-enterprise` points this at its
    # `SearchHighlighter` when the gem is loaded (HAB-812).
    #
    # Per-resource search (`search_fields`, `Search::SearchMatcher`) is free and unaffected: the
    # list stays filtered, it just carries no highlighted snippets.
    mattr_accessor :search_highlighter_class
    @@search_highlighter_class = nil

    # Name of the method Habarico calls (via `send`) as its authentication before_action, on both
    # Habarico::Controller and Habarico::ApplicationController. Point this at an existing no-argument
    # auth method on your ApplicationController (e.g. `:authenticate_user!`) to reuse it directly. If
    # your auth method takes arguments, define a one-line wrapper method instead and point this at
    # that.
    mattr_accessor :authenticate_method
    @@authenticate_method = :authenticate_request

    # Resolves `search_highlighter_class` to a class, or nil when no highlighter is registered.
    # Accepts a class or a string so the setting can be written in an initializer before the
    # constant is loaded, matching how `base_controller_class` is handled.
    def self.search_highlighter_class!
      value = search_highlighter_class
      return nil if value.nil?

      value.is_a?(String) ? value.constantize : value
    end
  end
end
