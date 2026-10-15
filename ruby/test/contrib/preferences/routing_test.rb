require "test_helper"
require "action_dispatch"

class RoutingExtensionHookTest < Minitest::Test
  def setup
    @saved = Habarico::RoutingService.extension_route_blocks.dup
    @saved_resources = Habarico::Config.resources
    Habarico::RoutingService.extension_route_blocks.clear
  end

  def teardown
    Habarico::RoutingService.extension_route_blocks.clear
    Habarico::RoutingService.extension_route_blocks.concat(@saved)
    Habarico::Config.resources = @saved_resources
  end

  def test_register_route_block_accumulates
    block = proc { get "x" }
    Habarico::RoutingService.register_route_block(&block)
    assert_includes Habarico::RoutingService.extension_route_blocks, block
  end

  def test_requiring_preferences_registers_a_block
    load_preference_routes!
    refute_empty Habarico::RoutingService.extension_route_blocks
  end

  # Guards the controller path in the extension blocks: Rails only strips a leading slash
  # from a controller when a module scope is active, so the blocks must resolve to the gem
  # controller both at the prefix root (flat resource list) and inside the path-only scope
  # RoutingService opens for a grouped resource config.
  def test_blocks_resolve_to_the_gem_controller_at_the_prefix_root
    load_preference_routes!
    Habarico::Config.resources = %i[articles]

    assert_equal "habarico/contrib/preferences/user_preferences",
                 controller_for(draw_extension_routes, "/api/user-preferences")
  end

  def test_blocks_resolve_to_the_gem_controller_inside_a_group_scope
    load_preference_routes!
    Habarico::Config.resources = [{ admin: %i[articles] }]

    assert_equal "habarico/contrib/preferences/user_preferences",
                 controller_for(draw_extension_routes, "/api/admin/user-preferences")
  end

  private

  def load_preference_routes!
    require "habarico/contrib/preferences"
    Habarico::RoutingService.extension_route_blocks.clear
    load File.expand_path("../../../lib/habarico/contrib/preferences/routes.rb", __dir__)
  end

  # Runs the production placement logic (RoutingService.draw_extension_routes) inside a
  # standalone route set, so the blocks are drawn exactly as draw_routes would draw them.
  def draw_extension_routes
    route_set = ActionDispatch::Routing::RouteSet.new
    route_set.draw do
      scope "api" do
        Habarico::RoutingService.draw_extension_routes(self)
      end
    end
    route_set
  end

  # Reads the controller straight off the drawn route (recognize_path would try to
  # constantize it, which needs the engine's autoloader).
  def controller_for(route_set, path)
    route = route_set.routes.find { |candidate| candidate.path.spec.to_s == "#{path}(.:format)" }
    refute_nil route, "no route drawn for #{path}: #{route_set.routes.map { |r| r.path.spec.to_s }}"
    route.defaults[:controller]
  end
end
