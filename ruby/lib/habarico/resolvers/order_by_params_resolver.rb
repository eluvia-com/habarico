module Habarico
  # Resolves the `order_by` query parameter against what the resource offers for sorting.
  #
  # The notation itself - `field:direction`, exactly one `:`, a lower-case `asc`/`desc` - and the
  # name of the parameter in camel-case mode belong to `set_pagination`, which runs first and
  # answers its own 422. What is left here is the field whitelist, the part only habarico knows:
  # the `sort_by` values its schema advertises.
  class OrderByParamsResolver
    def initialize(definition)
      @definition = definition
    end

    # The requested field names; raises `Eluvia::Errors::UnprocessableEntity` listing every field
    # the resource does not sort by, the way the Python backend answers.
    def resolve(params)
      # Forced sorting is not read off the request at all, so refusing the parameter here would
      # refuse a request the backend is about to serve.
      return [] if @definition.force_sorting

      field_names = Habarico::OrderByHelper.parse(params[Eluvia::PaginationHandler.order_by_param_name]).map(&:first)
      unknown = field_names.reject { |field_name| allowed?(field_name) }
      raise_unknown_fields(unknown) if unknown.any?

      field_names
    end

    # Values this resource accepts in `order_by`, or nil when it exposes no whitelist at all - see
    # `Habarico::SortingHelper`.
    def allowed_fields
      return @allowed_fields if defined?(@allowed_fields)

      @allowed_fields = Habarico::SortingHelper.allowed_order_by_fields(@definition)
    end

    private

    def allowed?(field_name)
      allowed_fields.nil? || allowed_fields.include?(field_name)
    end

    def raise_unknown_fields(field_names)
      errors = field_names.to_h do |field_name|
        ["order_by__#{field_name}", I18n.t('habarico.errors.order_by.unknown_field', default: 'Unknown field name.')]
      end
      raise Eluvia::Errors::UnprocessableEntity.new(errors)
    end
  end
end
