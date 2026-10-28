module Habarico
  # Reads and writes the `field:direction` notation of the `default_sorting` declarations and the
  # `fallback_order_by` habarico hands to `set_pagination`, which parses the `order_by` query
  # parameter itself. `order_by` names only this notation; what a resource offers to sort by is
  # `Habarico::SortingResolver` and `Habarico::OrderByValidator`.
  module OrderByHelper

    # `field_names` in the notation, every one in `direction` (`id:asc,tenant_id:asc`); `''` for none.
    def self.build(field_names, direction)
      field_names.map { |field_name| "#{field_name}:#{direction}" }.join(',')
    end

    # Field names of a whole value, tolerating an entry written without a direction the way a
    # hand-written `default_sorting` may be - this reads declarations, not requests.
    def self.field_names(value)
      value.to_s.split(',').filter_map { |entry| field_name(entry) }
    end

    # Field name of a single entry, tolerating a bare `field` without a direction: a
    # `default_sorting` declaration is written by hand and may be spelled that way.
    def self.field_name(entry)
      segments(entry).first.presence
    end

    # Direction of a single entry - `asc` unless `desc` is spelled out.
    def self.direction(entry)
      segments(entry)[1] == 'desc' ? 'desc' : 'asc'
    end

    def self.segments(entry)
      entry.to_s.strip.split(':', -1)
    end
    private_class_method :segments

  end
end
