module Habarico
  class RoutingService
    include Singleton

    # Opt-in contrib modules register extra route blocks. They are drawn at the admin-site
    # root - beside schema/search - which for a grouped resource config (e.g.
    # `{ admin: [...] }`) means under the top-level group's path, and for a flat resource
    # list means directly under `routing_url_prefix`. This mirrors the Python AdminSite,
    # where user-preferences sits next to schema/search. See draw_extension_routes.
    @extension_route_blocks = []

    # Route blocks drawn *inside* every resource's own `resources ... do` block, where a feature
    # can add member/collection routes to each resource (the aggregate endpoint does). Registered
    # by a pro/enterprise gem; empty in a free-only install - see draw_resource_extension_routes.
    @resource_extension_route_blocks = []

    class << self
      attr_reader :extension_route_blocks, :resource_extension_route_blocks

      def register_route_block(&block)
        extension_route_blocks << block
      end

      # Registers a block drawn inside each resource's route block. The block is instance_exec'd
      # in the Rails mapper, so it may use `collection` / `member` exactly as core's own route
      # helpers do, and receives the resource name.
      def register_resource_route_block(&block)
        resource_extension_route_blocks << block
      end

      # Draws the registered per-resource blocks. Called once per resource, before core's own
      # routes: a collection route added here must not be shadowed by the member `GET /:id/schema`
      # route, which has no `:id` constraint and would otherwise match it first.
      def draw_resource_extension_routes(mapper, resource_name)
        resource_extension_route_blocks.each do |block|
          mapper.instance_exec(resource_name, &block)
        end
      end

      # Draws the registered extension blocks in the given routing mapper, at the admin-site
      # root so they sit beside schema/search - matching the Python AdminSite. When the
      # resources are wrapped in a top-level group the site root is that group's path, so
      # re-open it here; for a flat resource list it is the url prefix itself. This is a
      # path-only `scope` (not a `namespace`) on purpose: the contrib controllers live in the
      # gem, not under the host's module, so no module prefix may be applied to them.
      def draw_extension_routes(mapper)
        top_group = Habarico::Config.resources.find { |spec| spec.is_a?(Hash) }&.keys&.first
        return draw_extension_route_blocks(mapper) unless top_group

        mapper.scope(top_group) { draw_extension_route_blocks(mapper) }
      end

      private

      # The blocks are written against the routing mapper DSL, so they must be evaluated in
      # the mapper's context (`scope` above only changes the mapper state, not `self`).
      def draw_extension_route_blocks(mapper)
        extension_route_blocks.each { |route_block| mapper.instance_exec(&route_block) }
      end
    end

    def draw_routes
      Rails.application.routes.draw do
        def _draw_routes(specs)
          specs.each do |resource_or_namespace|
            if resource_or_namespace.is_a?(Hash)
              resource_or_namespace.each do |namespace_name, specs_2|
                namespace namespace_name do
                  _draw_routes(specs_2)
                end
              end
            else
              get 'schema', to: '/habarico/global_schema#index'
              _draw_resource_routes(resource_or_namespace)
            end
          end
        end

        def _draw_resource_routes(resource_name)
          resources resource_name, only: %i[index show create update destroy] do
            # Must be drawn before `_draw_schema_routes`: its member route `GET /:id/schema` has no `:id`
            # constraint, so it would otherwise greedily match a contributed collection route too (with
            # `:id` == "aggregate", say) and shadow it, since Rails resolves ambiguous matches by
            # registration order.
            Habarico::RoutingService.draw_resource_extension_routes(self, resource_name)
            _draw_actions_routes(resource_name)
            _draw_schema_routes
          end
        end

        def _draw_actions_routes(resource_name)
          resource_path = Habarico::ResourceService.instance.get_resource_path(resource_name)
          controller_class = Habarico::ResourceService.instance.get_controller_class(resource_path)
          registered_actions = controller_class.registered_actions

          # Member actions
          member_actions = registered_actions.select { |action| action[:is_detail] }
          unless member_actions.empty?
            member do
              member_actions.each do |action|
                _draw_action_routes(action, is_member: true)
              end
            end
          end

          # Collection actions
          collection_actions = registered_actions.reject { |action| action[:is_detail] }
          unless collection_actions.empty?
            collection do
              collection_actions.each do |action|
                _draw_action_routes(action, is_member: false)
              end
            end
          end
        end

        def _draw_action_routes(action, is_member: true)
          if action[:method] == :get
            get action[:name]
          elsif action[:method] == :post
            post action[:name]
          elsif action[:method] == :put
            put action[:name]
          elsif action[:method] == :patch
            patch action[:name]
          elsif action[:method] == :delete
            delete action[:name]
          else
            raise Eluvia::Errors::StandardError.new("Unsupported HTTP method #{action[:method]} for action #{action[:name]}")
          end
          get "#{action[:name]}/schema", to: "/habarico/action_schema##{is_member ? 'show' : 'index'}"
        end

        def _draw_schema_routes
          collection do
            get :schema, to: '/habarico/local_schema#index'
          end
          member do
            get :schema, to: '/habarico/local_schema#show'
          end
        end

        scope Habarico::Config.routing_url_prefix do
          if Habarico::Config.routing_scope
            scope module: Habarico::Config.routing_scope do
              _draw_routes(Habarico::Config.resources)
            end
          else
            _draw_routes(Habarico::Config.resources)
          end

          # Opt-in contrib extension routes (e.g. user-preferences) - see
          # RoutingService.draw_extension_routes for the placement rules.
          Habarico::RoutingService.draw_extension_routes(self)
        end
      end
    end

  end
end
