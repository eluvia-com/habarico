module Habarico
  module Contrib
    module Preferences
      # Exact base preference keys -> schema (mirrors Python base.py BASE_PREFERENCES).
      BASE_PREFERENCES = {
        "theme" => Schemas::THEME,
        "locale" => Schemas::LOCALE,
        "preferences.dashboard" => Schemas::DASHBOARD,
        "preferences.layout.app.pageWidth" => Schemas::APP_PAGE_WIDTH,
        "preferences.layout.app.contrastMode" => Schemas::CONTRAST_MODE,
        "preferences.layout.app.stripedRows" => Schemas::STRIPED_ROWS,
        "preferences.layout.app.density" => Schemas::APP_DENSITY,
      }.freeze

      # Pattern base keys -> schema (mirrors Python base.py PATTERN_PREFERENCES).
      PATTERN_PREFERENCES = {
        %r{[a-zA-Z][a-zA-Z0-9_./-]*\.savedQueries} => Schemas::SAVED_QUERIES,
        %r{[a-zA-Z][a-zA-Z0-9_./-]*\.columns} => Schemas::COLUMNS,
        %r{[a-zA-Z][a-zA-Z0-9_./-]*\.columnWidths} => Schemas::COLUMN_WIDTHS,
      }.freeze

      # Registers all base preferences. A default is applied to an exact key only when present
      # in Preferences.defaults; otherwise the key is registered with no default. Pattern keys
      # never carry a built-in default. Mirrors Python register_base_preferences.
      def self.register_base_preferences
        defaults = Preferences.defaults || {}
        BASE_PREFERENCES.each do |key, schema|
          if defaults.key?(key)
            register_preference(key, schema: schema, default: defaults[key])
          else
            register_preference(key, schema: schema)
          end
        end
        PATTERN_PREFERENCES.each do |pattern, schema|
          register_preference_pattern(pattern, schema: schema)
        end
      end
    end
  end
end
