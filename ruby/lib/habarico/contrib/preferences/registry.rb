require "json"
require "json_schemer"
require "securerandom"
require "habarico/contrib/preferences/errors"

module Habarico
  module Contrib
    module Preferences
      # Regex a preference key must match. Mirrors the Python KEY_PATTERN.
      KEY_PATTERN = %r{\A[a-zA-Z][a-zA-Z0-9_./-]*\z}

      # Sentinel meaning "no default registered". Distinct from nil, which is a valid
      # stored/default value.
      EMPTY = Object.new
      def EMPTY.inspect = "EMPTY"

      # Value object returned by get_value/get_values/set_value.
      ResolvedPreference = Struct.new(:key, :value, :updated_at, keyword_init: true)

      # One registered entry: its JSON Schema, its (possibly EMPTY/callable) default, a compiled
      # json_schemer validator and its already-resolved size limit (nil meaning unlimited).
      #
      # `max_bytes` needs no sentinel, unlike `default`: nil is not a usable size, so it simply
      # means "not given at registration" and defers to `max_value_bytes`. It is resolved once, at
      # registration, exactly like `defaults` - nothing reads the configuration per write.
      Entry = Struct.new(:schema, :default, :validator, :max_bytes, :migrate_value, keyword_init: true)

      class PreferenceRegistry
        def initialize
          @entries = {}          # key (String) => Entry
          @pattern_entries = []  # [[Regexp, Entry], ...]
        end

        # Test/reload hook.
        def _clear
          @entries.clear
          @pattern_entries.clear
        end

        # `migrate_value` is called with a stored value that no longer validates, before it would be
        # deleted; whatever it returns is validated and saved. It is how the package that owns a
        # shape changes it without a data migration.
        def register(key, schema:, default: EMPTY, max_bytes: nil, migrate_value: nil)
          raise InvalidPreferenceKey, key unless key.is_a?(String) && key.match?(KEY_PATTERN)
          raise PreferenceAlreadyRegistered, key if @entries.key?(key)

          @entries[key] = build_entry(key, schema, default, max_bytes, migrate_value)
          nil
        end

        def register_pattern(pattern, schema:, max_bytes: nil)
          # A pattern entry never carries a default - there is no single key to attach one to - so
          # `build_entry` returns on its EMPTY branch without validating anything. Same entry, one
          # place: the two registration paths cannot drift when a field is added to `Entry`.
          compiled = pattern.is_a?(Regexp) ? pattern : Regexp.new(pattern)
          @pattern_entries << [compiled, build_entry(compiled.source, schema, EMPTY, max_bytes)]
          nil
        end

        def registered?(key)
          return true if @entries.key?(key)

          @pattern_entries.any? { |pattern, _| full_match?(pattern, key) }
        end

        def get_schema(key)
          entry_for(key).schema
        end

        def get_default(key)
          default = resolve_default(entry_for(key))
          default.equal?(EMPTY) ? nil : default
        end

        # Size limit in bytes for a key, or nil when it is unlimited.
        def max_bytes_for(key)
          entry_for(key).max_bytes
        end

        def validate(key, value)
          entry = entry_for(key)
          ensure_size_allowed!(key, entry, value)
          errors = entry.validator.validate(value).to_a
          raise PreferenceValidationError.new(key, errors.first&.dig("error").to_s) unless errors.empty?

          value
        end

        def get_value(user_id, key)
          entry = entry_for(key)
          record = UserPreference.find_by(user_id: user_id, key: key)
          resolve(key, entry, record)
        end

        def get_values(user_id)
          resolved = {}

          UserPreference.where(user_id: user_id).find_each do |record|
            entry = begin
              entry_for(record.key)
            rescue PreferenceNotRegistered
              record.destroy
              next
            end
            item = resolve(record.key, entry, record)
            resolved[record.key] = item if item
          end

          @entries.each do |key, entry|
            next if resolved.key?(key)

            item = resolve(key, entry, nil)
            resolved[key] = item if item
          end

          resolved.keys.sort.map { |key| resolved[key] }
        end

        def set_value(user_id, key, value)
          validate(key, value)
          ensure_key_budget!(user_id, key)
          record = UserPreference.find_or_initialize_by(user_id: user_id, key: key)
          record.id ||= SecureRandom.uuid
          record.value = value
          record.updated_at = Time.current
          record.save!
          ResolvedPreference.new(key: key, value: record.value, updated_at: record.updated_at)
        end

        def delete_value(user_id, key)
          entry_for(key) # raises PreferenceNotRegistered for unknown keys
          UserPreference.where(user_id: user_id, key: key).delete_all
          nil
        end

        def delete_values(user_id)
          UserPreference.where(user_id: user_id).delete_all
          nil
        end

        private

        # Ahead of the schema: the size guard is the cheap check and the one that has to hold for
        # free-form branches (a saved query's `filter`) the schema does not bound at all.
        def ensure_size_allowed!(key, entry, value)
          limit = entry.max_bytes
          return if limit.nil?

          size = JSON.generate(value).bytesize
          raise PreferenceValueTooLarge.new(key, limit, size) if size > limit
        end

        # Configured limit for the key - or pattern - a preference is being registered under.
        # `max_value_bytes` decides first, by the very string the preference is registered under: a
        # deployment's word outranks a limit a gem registered, which is itself a default above the
        # hash's "default" entry. A nil anywhere there means unlimited. A pattern may be configured as
        # a Regexp or as its source string. Read once, at registration, exactly like `defaults`:
        # changing the config afterwards does not move an already-registered limit.
        def resolve_max_bytes(registered_as, max_bytes)
          limits = Preferences.max_value_bytes || {}
          limits.each do |configured, bytes|
            name = configured.is_a?(Regexp) ? configured.source : configured.to_s
            return bytes if name == registered_as
          end
          return max_bytes unless max_bytes.nil?

          limits["default"]
        end

        # Refuses a NEW key once the user holds the maximum number of preferences. Overwriting a
        # key they already have is always allowed, so nobody already past the limit is locked out
        # of shrinking or fixing what they stored.
        def ensure_key_budget!(user_id, key)
          limit = Preferences.max_keys_per_user
          return if limit.nil?

          every_key_of_user = UserPreference.where(user_id: user_id)
          # Overwriting a key the user already has adds no row, so it never spends budget - and
          # without this guard a user sitting exactly at the limit could not rewrite anything.
          return if every_key_of_user.where(key: key).exists?
          raise TooManyPreferences.new(key, limit) if every_key_of_user.count >= limit
        end

        # json_schemer patterns must match the WHOLE key, like Python's fullmatch.
        def full_match?(pattern, key)
          match = pattern.match(key)
          !match.nil? && match[0] == key
        end

        def entry_for(key)
          return @entries[key] if @entries.key?(key)

          @pattern_entries.each { |pattern, entry| return entry if full_match?(pattern, key) }
          raise PreferenceNotRegistered, key
        end

        def build_entry(key, schema, default, max_bytes = nil, migrate_value = nil)
          validator = JSONSchemer.schema(schema)
          entry = Entry.new(schema: schema, default: default, validator: validator,
                            max_bytes: resolve_max_bytes(key, max_bytes), migrate_value: migrate_value)
          return entry if default.equal?(EMPTY) || default.respond_to?(:call)

          errors = validator.validate(default).to_a
          raise PreferenceValidationError.new(key, errors.first&.dig("error").to_s) unless errors.empty?

          entry
        end

        # Gives the owner's schema a chance to bring a stored value up to date, in place.
        #
        # A migration that does not validate, or one that raises, leaves the record to be deleted:
        # a schema's own bug must not make reading preferences fail.
        def migrate_stored_value(entry, record)
          return false if entry.migrate_value.nil?

          migrated = entry.migrate_value.call(record.value)
          return false unless entry.validator.valid?(migrated)

          record.update!(value: migrated)
          true
        rescue StandardError
          false
        end

        # Resolves a (possibly callable) default. A callable that returns EMPTY or an
        # invalid value degrades to EMPTY, mirroring Python `_resolve_default`.
        def resolve_default(entry)
          default = entry.default
          return default unless default.respond_to?(:call)

          resolved = default.call
          return EMPTY if resolved.equal?(EMPTY)
          return EMPTY unless entry.validator.valid?(resolved)

          resolved
        end

        # Mirrors Python `_resolve`: a stored value that fails validation is deleted and the
        # default is returned instead; when there is neither a valid stored value nor a default,
        # returns nil (single-GET => 404, list => omit).
        def resolve(key, entry, record)
          if record
            if entry.validator.valid?(record.value) || migrate_stored_value(entry, record)
              return ResolvedPreference.new(key: key, value: record.value, updated_at: record.updated_at)
            end

            record.destroy
          end

          default = resolve_default(entry)
          return nil if default.equal?(EMPTY)

          ResolvedPreference.new(key: key, value: default, updated_at: nil)
        end
      end

      # ---- module-level singleton API (mirrors Python module functions) ----

      def self.registry
        @registry ||= PreferenceRegistry.new
      end

      def self.register_preference(key, schema:, default: EMPTY, max_bytes: nil, migrate_value: nil)
        registry.register(key, schema: schema, default: default, max_bytes: max_bytes, migrate_value: migrate_value)
      end

      def self.register_preference_pattern(pattern, schema:, max_bytes: nil)
        registry.register_pattern(pattern, schema: schema, max_bytes: max_bytes)
      end

      def self.max_bytes_for(key)
        registry.max_bytes_for(key)
      end

      def self.registered?(key)
        registry.registered?(key)
      end

      def self.get_schema(key)
        registry.get_schema(key)
      end

      def self.get_default(key)
        registry.get_default(key)
      end

      def self.validate(key, value)
        registry.validate(key, value)
      end

      def self.get_value(user_id, key)
        registry.get_value(user_id, key)
      end

      def self.get_values(user_id)
        registry.get_values(user_id)
      end

      def self.set_value(user_id, key, value)
        registry.set_value(user_id, key, value)
      end

      def self.delete_value(user_id, key)
        registry.delete_value(user_id, key)
      end

      def self.delete_values(user_id)
        registry.delete_values(user_id)
      end
    end
  end
end
