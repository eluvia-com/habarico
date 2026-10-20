Rails.application.configure do
  config.enable_reloading = true
  config.eager_load = false
  config.consider_all_requests_local = true
  config.active_record.migration_error = :page_load

  # The service name in ../compose.yaml, reachable under that name from the frontend container.
  config.hosts << 'rails'

  # The password reset e-mail is printed to the console.
  config.action_mailer.delivery_method = :console
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
end
