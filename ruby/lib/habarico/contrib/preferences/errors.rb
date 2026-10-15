module Habarico
  module Contrib
    module Preferences
      # Base class for all preference errors.
      class PreferenceError < StandardError; end

      # Raised when a key is neither registered exactly nor matched by a pattern.
      class PreferenceNotRegistered < PreferenceError
        attr_reader :key

        def initialize(key)
          @key = key
          super(%(Preference key "#{key}" is not registered.))
        end
      end

      # Raised when the same exact key is registered twice.
      class PreferenceAlreadyRegistered < PreferenceError
        attr_reader :key

        def initialize(key)
          @key = key
          super(%(Preference key "#{key}" is already registered.))
        end
      end

      # Raised when a key does not match the allowed key format.
      class InvalidPreferenceKey < PreferenceError
        attr_reader :key

        def initialize(key)
          @key = key
          super(
            %(Preference key "#{key}" is invalid. Keys must match ) +
              %("^[a-zA-Z][a-zA-Z0-9_./-]*$" (ASCII letters, digits, underscore, dot, ) +
              %(slash, hyphen; must start with a letter).)
          )
        end
      end

      # Base for the size and count guards. Both surface as 422, like a schema mismatch.
      class PreferenceLimitExceeded < PreferenceError; end

      # Raised when a value serializes to more bytes than the key's limit allows.
      class PreferenceValueTooLarge < PreferenceLimitExceeded
        attr_reader :key, :limit, :actual

        def initialize(key, limit, actual)
          @key = key
          @limit = limit
          @actual = actual
          super(%(Value for preference "#{key}" is #{actual} bytes, over the #{limit} byte limit.))
        end
      end

      # Raised when storing a new key would take a user past `max_keys_per_user`.
      class TooManyPreferences < PreferenceLimitExceeded
        attr_reader :key, :limit

        def initialize(key, limit)
          @key = key
          @limit = limit
          super(%(Cannot store preference "#{key}": the limit of #{limit} preferences per user is already reached.))
        end
      end

      # Raised when a value fails JSON Schema validation for its key.
      class PreferenceValidationError < PreferenceError
        attr_reader :key, :validation_message

        def initialize(key, message)
          @key = key
          @validation_message = message
          super(%(Value for preference "#{key}" failed validation: #{message}))
        end
      end
    end
  end
end
