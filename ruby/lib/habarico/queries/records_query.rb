module Habarico
  # Builds the record scopes of a resource: the list of `index` and the single record of the detail
  # endpoints, both bounded by the resource `policy_scope`.
  class RecordsQuery
    def initialize(definition, context)
      @definition = definition
      @context = context
    end

    # The model scope narrowed by `policy_scope`, so a record outside it (other tenant,
    # soft-deleted, ...) is neither listed nor found.
    def base_scope
      scope = @definition.model.all
      scope = @definition.policy_scope.call(scope, @context) if @definition.policy_scope.present?
      scope
    end

    # The record with primary key `pk`; raises `ActiveRecord::RecordNotFound` outside the scope.
    def find(pk)
      scope = base_scope
      scope = scope.filter_2(@definition.default_filter, current_user: current_user) if scope.respond_to?(:filter_2)
      scope.find(pk)
    end

    # The records a list request selects - scopes, filters, fulltext search and `default_filter` -
    # unordered and unpaginated.
    def filtered(filters, search_query:)
      records = base_scope
      Array(@definition.scopes).each do |scope|
        records = records.public_send(scope) if records.respond_to?(scope)
      end

      apply_filtering(records, filters, search_query)
    end

    # One page of the list: the `filtered` records with includes, ordering and pagination.
    def list(filters, search_query:, order_by:, page:, limit:, padding:)
      records = filtered(filters, search_query: search_query)
      records = records.includes(*@definition.includes) if @definition.includes.present?
      records = records.respond_to?(:order_2) ? records.order_2(order_by) : records.order(order_by)
      records = records.page(page).per(limit).padding(padding)

      @definition.prefetch.call(records) if @definition.prefetch.respond_to?(:call)
      records
    end

    private

    def apply_filtering(scope, filters, search_query)
      scope = scope.filter_2!(filters, current_user: current_user) if scope.respond_to?(:filter_2!)

      # Typed fulltext search (owned by Habarico, see SearchMatcher) - applied after the other
      # filters so it further narrows the already-filtered set (AND semantics).
      scope = apply_search(scope, search_query)

      # Default filter - applied after filter_2! so it is never dropped when a :filter string param
      # is present (filter_2! discards non-:filter keys in that branch, which would silently bypass
      # default_filter).
      if @definition.default_filter.present? && scope.respond_to?(:filter_2)
        scope = scope.filter_2(@definition.default_filter, current_user: current_user)
      end

      scope
    end

    def apply_search(scope, search_query)
      return scope if search_query.blank? || @definition.search_fields.blank?

      Habarico::Search::SearchMatcher.new(
        model: @definition.model,
        search_fields: @definition.search_fields
      ).apply(scope, search_query)
    end

    def current_user
      @context.current_user
    end
  end
end
