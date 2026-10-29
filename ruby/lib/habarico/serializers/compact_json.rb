module Habarico
  module Serializers
    COMPACTABLE = [nil, {}].freeze

    # `object` as JSON without nil values and empty hashes at any depth; nil for nil.
    def self.compact_json(object)
      object&.as_json&.deep_compact(compactable: COMPACTABLE)
    end
  end
end
