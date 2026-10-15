module Habarico
  module Authenticatable
    extend ActiveSupport::Concern

    included do
      before_action :run_authentication
    end

    private

    # Calls `Habarico::Config.authenticate_method` (`:authenticate_request` by default) on the
    # controller. Deliberately does NOT define a fallback `authenticate_request` method itself:
    # since this module is `include`d directly into `Habarico::Controller`/`Habarico::ApplicationController`,
    # any method defined here would sit ahead of your ApplicationController in the ancestor chain
    # (`include`d modules resolve before the superclass) and would silently shadow your override.
    # Checking `respond_to?` first, instead of defining a raising default, avoids that.
    #
    # See https://docs.habarico.com/ruby/authentication for how to implement `authenticate_request`
    # (or configure `config.authenticate_method`) in your own ApplicationController.
    def run_authentication
      method_name = Habarico::Config.authenticate_method
      unless respond_to?(method_name, true)
        raise NotImplementedError, "Habarico authentication is not configured: configure " \
                                   "config.authenticate_method or implement ##{method_name} (and #current_user) in your " \
                                   'ApplicationController.'
      end
      send(method_name)
    end

  end
end
