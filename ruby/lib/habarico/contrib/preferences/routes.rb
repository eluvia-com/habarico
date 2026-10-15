# Registers the user-preferences routes through the RoutingService extension hook, so the
# host's config/routes.rb (a single `RoutingService.instance.draw_routes`) needs no change.
# The blocks are drawn at the admin-site root (beside schema/search) - matching the Python
# AdminSite, where user-preferences lives next to schema/search. RoutingService draws them
# inside a path-only `scope` (never a `namespace`/`scope module:`), so the controller path
# must NOT start with a slash: Rails only strips a leading slash when a module scope is
# active, and raises "is not a supported controller name" otherwise.
# Keys may contain dots and slashes, so the `:key` segment is a glob with format off.
Habarico::RoutingService.register_route_block do
  controller_path = "habarico/contrib/preferences/user_preferences"

  get    "user-preferences",       to: "#{controller_path}#index"
  delete "user-preferences",       to: "#{controller_path}#destroy_all"
  get    "user-preferences/*key",  to: "#{controller_path}#show",    format: false
  put    "user-preferences/*key",  to: "#{controller_path}#update",  format: false
  delete "user-preferences/*key",  to: "#{controller_path}#destroy", format: false
end
