module Habarico
  module ActionHelper

    def self.is_standard_action?(action)
      %w[show create update delete].include?(action.name)
    end

    # An action that spells out its own target - another resource, another record, or both. Such an
    # action always needs its endpoint in the schema, even when its name is one of the standard
    # ones: the endpoint is the only place the target is written down, and without it the frontend
    # falls back to the resource and the record the action ran on.
    def self.has_explicit_target?(action)
      action.endpoint_reference.present? || action.endpoint_record_pk.present?
    end

  end
end
