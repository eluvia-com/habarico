Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = false
  config.consider_all_requests_local = true
  config.action_dispatch.show_exceptions = :none
  # On, unlike the Rails default for this environment: the CSRF handshake is part of the contract
  # the admin relies on, so the suite has to exercise it.
  config.action_controller.allow_forgery_protection = true

  config.action_mailer.delivery_method = :test
end
