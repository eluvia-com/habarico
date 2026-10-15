module Habarico
  module Contrib
    module Preferences
      # Serializes a ResolvedPreference into the API item shape { key, value, updated_at }.
      # Mirrors the Python UserPreferenceItemSerializer.
      module Serializer
        module_function

        def item(resolved)
          {
            "key" => resolved.key,
            "value" => resolved.value,
            "updated_at" => resolved.updated_at&.iso8601,
          }
        end
      end
    end
  end
end
