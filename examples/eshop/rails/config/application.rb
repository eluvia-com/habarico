require_relative 'boot'

require 'rails'
require 'active_model/railtie'
require 'active_record/railtie'
require 'action_controller/railtie'
require 'action_mailer/railtie'

Bundler.require(*Rails.groups)

module Eshop
  class Application < Rails::Application
    config.load_defaults 7.2
    config.api_only = true

    config.time_zone = 'UTC'
    config.i18n.default_locale = :en

    # An API-only app ships neither middleware. The frontend dev server proxies /api here, so the
    # admin and the API share one origin and this session cookie reaches both.
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore, key: '_eshop_session', same_site: :lax

    # Where the reset link in the e-mail points: the admin's reset-password page.
    config.x.password_reset_url = ENV.fetch('PASSWORD_RESET_URL', 'http://localhost:5173/#/reset-password/%<token>s')
  end
end
