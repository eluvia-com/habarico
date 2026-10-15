require_relative "../../integration/integration_helper"
require "action_controller/railtie"
require "action_dispatch"
require "habarico/contrib/preferences"

# Minimal Rails app that mounts the preferences routes through the same RoutingService hook
# used in production, and stubs authentication so `current_user` returns a fixed id. This is
# the parity gate for the HTTP contract (status codes + body shape the frontend depends on).
module PreferencesTestApp
  Struct.new("TestUser", :id) unless defined?(Struct::TestUser)

  # Force a known current_user regardless of the auth mechanism the host app plugs in: override the
  # auth hook on the controller so the endpoints resolve a stable user scope without a real token.
  module StubAuth
    def authenticate_request = true
    def current_user = Struct::TestUser.new(ENV.fetch("PREF_TEST_USER_ID", "u1"))
  end

  def self.build!
    return @app if @app

    app = Class.new(Rails::Application) do
      config.eager_load = false
      config.consider_all_requests_local = true
      config.secret_key_base = "test"
      config.hosts.clear
      config.active_support.to_time_preserves_timezone = :zone if config.active_support.respond_to?(:to_time_preserves_timezone=)
    end
    app.initialize!

    # The controller is autoloaded via the engine (app/controllers); reference it only after
    # initialize! so its superclass Habarico::ApplicationController is resolvable.
    Habarico::Contrib::Preferences::UserPreferencesController.prepend(StubAuth)

    app.routes.draw do
      Habarico::RoutingService.extension_route_blocks.each { |b| instance_exec(&b) }
    end
    @app = app
  end
end
