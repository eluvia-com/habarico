module Habarico
  # The one place that reads the `field:direction` notation, shared by the `order_by` query
  # parameter and the `default_sorting` declarations.
  #
  # `Eluvia::PaginationHandler#set_pagination` reads the query parameter exactly this way and
  # answers 422 for anything that does not match, so by the time habarico looks at the parameter
  # every entry is known to be well formed. This helper has to stay in step with it.
  module OrderByHelper

    DIRECTIONS = %w[asc desc].freeze

    # Splits a whole `order_by` value (`name:asc,created_at:desc`) into `[field_name, direction]`
    # pairs, dropping every entry that is not in that form - `set_pagination` has already refused
    # the request over those, so nothing downstream has to decide what to do with them.
    def self.parse(value)
      value.to_s.split(',').filter_map { |entry| parse_entry(entry) }
    end

    # Splits a single `field:direction` entry, or nil when it is not exactly one non-blank field
    # name followed by one known direction.
    def self.parse_entry(entry)
      # `-1` keeps a trailing empty segment (`name:`), so it is read as a missing direction
      # instead of a bare field name - the same way `set_pagination` reads it.
      parts = segments(entry)
      return nil unless parts.length == 2

      field_name, direction = parts
      return nil if field_name.blank? || !DIRECTIONS.include?(direction)

      [field_name, direction]
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
