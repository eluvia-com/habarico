module Habarico
  # Checks the fields a list is ordered by against what the resource offers for sorting.
  #
  # The notation itself - `field:direction`, exactly one `:`, a lower-case `asc`/`desc` - and the
  # name of the parameter in camel-case mode belong to `set_pagination`, which parses `order_by`
  # first and answers its own 422. What is left here is the field whitelist, the part only habarico
  # knows: the `sort_by` values its schema advertises (`Habarico::SortingResolver`).
  class OrderByValidator
    def initialize(definition)
      @definition = definition
    end

    # Raises `Eluvia::Errors::UnprocessableEntity` listing every one of `field_names` the resource
    # does not sort by, the way the Python backend answers.
    def validate!(field_names)
      # Forced sorting is not read off the request at all, so there is nothing to refuse.
      return if @definition.force_sorting

      allowed_fields = sortable_fields
      return if allowed_fields.nil?

      unknown = field_names.map(&:to_s) - allowed_fields
      raise_unknown_fields(unknown) if unknown.any?
    end

    private

    # Every `sort_by` value this resource offers, or nil when it has no whitelist to offer: a model
    # without ActiveRecord reflection exposes no columns to check a field name against, so the
    # field names are left to the model itself.
    def sortable_fields
      # What the resource tells the frontend to sort by. The list view schema publishes a
      # `default_sorting` - the resource's, or the view's own - and the frontend puts exactly that
      # in `order_by` on the first request, so refusing it would refuse the backend's own answer.
      declared = declared_sorting_fields

      return (declared + @definition.sorting_fields.map(&:to_s)).uniq if @definition.sorting_fields.present?

      model = @definition.model
      return nil unless Habarico::ReflectionHelper.is_active_record_class?(model)

      resolver = Habarico::SortingResolver.new(model, sorting_fields: @definition.sorting_fields)
      names = declared

      # What the resource schema advertises for each declared field.
      (@definition.fields + @definition.read_only_fields).each do |field|
        names << field.sort_by if field.is_a?(Habarico::FieldReference)
        names << resolver.field_sort_by(Habarico::AttributesHelper.field_name(field))
      end

      # What the resource's own list views add on top: a column of an association is declared
      # there and never appears among the resource fields.
      list_view_field_references.each do |field_reference|
        names << resolver.descriptor_sort_by(field_reference)
      end

      # Virtual sortable columns registered on the model with `order_attr`.
      names += model.order_attrs.map { |order_attr| order_attr[:attr_name] } if model.respond_to?(:order_attrs)

      names.compact.map { |name| normalize(name) }.uniq
    end

    # Field names of every ordering this resource advertises: the one the definition falls back to,
    # the one each of its list views publishes on top of that, and the primary key.
    def declared_sorting_fields
      sortings = [@definition.default_sorting] + list_views.map(&:default_sorting)
      names = sortings.flat_map { |sorting| Habarico::OrderByHelper.field_names(sorting) }

      # The primary key is advertised too, as `pk_field_name` on the resource schema: the frontend
      # sorts by it whenever a list has no sorting of its own (`serializeOrderBy`).
      names += Habarico::ReflectionHelper.primary_key_fields(@definition.model)

      names.uniq
    end

    # A `sort_by` as it arrives in `order_by`. The frontend rewrites the first `.` of the
    # advertised value into `__` before sending it (`serializeOrderBy`), which is also the
    # separator `order_2` splits an association off by.
    def normalize(sort_by)
      sort_by.to_s.sub('.', '__')
    end

    # FieldReferences declared in the resource's own list views, including the ones nested in
    # boxes. A box pointing at another resource lists that resource's fields, not this one's.
    def list_view_field_references
      list_views.flat_map { |view| field_references(view.boxes) }
    end

    def field_references(boxes)
      Array(boxes).flat_map do |item|
        case item
        when Habarico::Box then item.reference.present? ? [] : field_references(item.boxes)
        when Habarico::FieldReference then [item]
        when ::String, ::Symbol then [Habarico::FieldReference.new(name: item.to_s)]
        else []
        end
      end
    end

    def list_views
      @definition.normalized_views.select { |view| view.type == :list }
    end

    def raise_unknown_fields(field_names)
      errors = field_names.to_h do |field_name|
        ["order_by__#{field_name}", I18n.t('habarico.errors.order_by.unknown_field', default: 'Unknown field name.')]
      end
      raise Eluvia::Errors::UnprocessableEntity.new(errors)
    end
  end
end
