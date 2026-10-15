# Optional Habarico module providing a per-user, JSON-Schema-validated preference store
# (theme, locale, dashboard layout, saved queries, column selection, ...). It is NOT loaded
# by `require "habarico"`; the host app opts in with `require "habarico/contrib/preferences"`
# and adds the `json_schemer` gem to its Gemfile.
begin
  require "json_schemer"
rescue LoadError => e
  raise LoadError, "habarico/contrib/preferences requires the `json_schemer` gem. " \
                   "Add it to your Gemfile.\n#{e.message}"
end

require "habarico"

require "habarico/contrib/preferences/errors"
require "habarico/contrib/preferences/config"
require "habarico/contrib/preferences/registry"
require "habarico/contrib/preferences/user_preference"
require "habarico/contrib/preferences/schemas"
require "habarico/contrib/preferences/base_preferences"
require "habarico/contrib/preferences/serializer"
require "habarico/contrib/preferences/routes"

# NOTE: UserPreferencesController lives in app/controllers so the Rails engine autoloads it
# (its superclass Habarico::ApplicationController is only available under a booted app). It is
# not required here; the routes above reference it by path and it resolves on the first request.

# Register the contrib's translations (opt-in module, not picked up by the engine's
# config/locales). Host apps can override any key in their own files.
I18n.load_path += Dir[File.expand_path("preferences/locales/*.yml", __dir__)]

# Register built-in preference keys on load (mirrors the Python AppConfig.ready hook).
Habarico::Contrib::Preferences.register_base_preferences
