module Habarico
  module Contrib
    module Preferences
      # Per-key default values for base preferences, mirroring the Python
      # `HABARICO_PREFERENCES["DEFAULTS"]` setting. A base key gets a default only when
      # present here (see base_preferences.rb). Host apps set this in an initializer:
      #   Habarico::Contrib::Preferences.defaults = { "theme" => "light" }
      mattr_accessor :defaults, default: {}

      # Largest serialized size (bytes) one preference value may have. Looked up by the exact
      # key -- or the pattern, as a Regexp or its source string -- a preference was registered
      # under, falling back to "default". `nil` (for one entry or for the whole setting) means
      # no limit. Mirrors the Python `HABARICO_PREFERENCES["MAX_VALUE_BYTES"]` setting.
      #
      # The values below sit an order of magnitude above what the frontend actually writes:
      # 100 datagrid columns are ~2 KB of `columns`/`columnWidths`, a 30-widget dashboard
      # ~19 KB and 20 saved queries ~11 KB at their fullest.
      mattr_accessor :max_value_bytes, default: {
        "default" => 16 * 1024,
        "preferences.dashboard" => 32 * 1024,
        %r{[a-zA-Z][a-zA-Z0-9_./-]*\.savedQueries} => 32 * 1024,
      }

      # Largest number of preference rows one user may hold, or `nil` for no limit. Checked only
      # when a NEW key is created, so a user already past the limit can still overwrite or shrink
      # what they already have. The cap is needed because the pattern keys match an unbounded set
      # of names, so the per-value limit alone does not bound the per-user total.
      mattr_accessor :max_keys_per_user, default: 2000
    end
  end
end
