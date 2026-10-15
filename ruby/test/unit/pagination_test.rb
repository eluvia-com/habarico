require "test_helper"

module Habarico
  # *****************************************************************************
  # HAB-946 - page size of a list endpoint: the resource declaration wins, then
  # Habarico::Config, then the eluvia-base default.
  # *****************************************************************************
  class PaginationTest < Minitest::Test

    # Minimal model double: `set_list_pagination` only reaches the definition for the sorting
    # defaults, never the model itself.
    ProductModel = Class.new

    def setup
      @original_default_page_limit = Habarico::Config.default_page_limit
      @original_max_page_limit = Habarico::Config.max_page_limit
      @original_base_max_page_limit = Eluvia::Base::Config.max_page_limit
    end

    def teardown
      Habarico::Config.default_page_limit = @original_default_page_limit
      Habarico::Config.max_page_limit = @original_max_page_limit
      Eluvia::Base::Config.max_page_limit = @original_base_max_page_limit
    end

    # `body` is evaluated in the controller class, the way a host application declares its own
    # methods on top of the concern.
    def build_controller(params = {}, default_page_limit: nil, max_page_limit: nil, &body)
      controller_class = Class.new(ActionController::Base) do
        include Habarico::Controller

        model ProductModel
        fields %i[name price]
      end
      controller_class.default_page_limit(default_page_limit) unless default_page_limit.nil?
      controller_class.max_page_limit(max_page_limit) unless max_page_limit.nil?
      controller_class.class_eval(&body) if body

      controller = controller_class.new
      controller.params = params
      controller
    end

    def paginate(params = {}, **resource_limits, &body)
      controller = build_controller(params, **resource_limits, &body)
      controller.send(:set_list_pagination)
      controller
    end

    # ***********************************************************************
    # Default limit
    # ***********************************************************************

    def test_default_limit_falls_back_to_the_library_default
      controller = paginate
      assert_equal 20, controller.instance_variable_get(:@limit)
    end

    def test_config_default_page_limit_is_used
      Habarico::Config.default_page_limit = 5
      controller = paginate
      assert_equal 5, controller.instance_variable_get(:@limit)
    end

    def test_resource_default_page_limit_wins_over_config
      Habarico::Config.default_page_limit = 5
      controller = paginate({}, default_page_limit: 3)
      assert_equal 3, controller.instance_variable_get(:@limit)
    end

    def test_requested_limit_wins_over_every_default
      Habarico::Config.default_page_limit = 5
      controller = paginate({ limit: '8' }, default_page_limit: 3)
      assert_equal 8, controller.instance_variable_get(:@limit)
    end

    def test_zero_default_page_limit_is_kept
      # Zero is a deliberate value (meta-only), so it must not be read as "nothing declared".
      controller = paginate({}, default_page_limit: 0)
      assert_equal 0, controller.instance_variable_get(:@limit)
    end

    # ***********************************************************************
    # Maximum limit
    # ***********************************************************************

    def test_library_default_cap_applies_without_configuration
      error = assert_raises(Eluvia::Errors::UnprocessableEntity) { paginate({ limit: '1001' }) }
      assert_equal ['limit'], error.messages.keys
    end

    def test_config_max_page_limit_is_used
      Habarico::Config.max_page_limit = 10

      assert_equal 10, paginate({ limit: '10' }).instance_variable_get(:@limit)
      assert_raises(Eluvia::Errors::UnprocessableEntity) { paginate({ limit: '11' }) }
    end

    def test_resource_max_page_limit_wins_over_config
      Habarico::Config.max_page_limit = 100

      error = assert_raises(Eluvia::Errors::UnprocessableEntity) { paginate({ limit: '50' }, max_page_limit: 10) }
      assert_equal ['limit'], error.messages.keys
      assert_equal 10, paginate({ limit: '10' }, max_page_limit: 10).instance_variable_get(:@limit)
    end

    def test_cap_can_be_removed_in_the_base_config
      Eluvia::Base::Config.max_page_limit = nil

      assert_equal 100_000, paginate({ limit: '100000' }).instance_variable_get(:@limit)
    end

    # ***********************************************************************
    # Overriding from a host controller
    # ***********************************************************************

    def test_host_controller_can_override_the_habarico_resolver
      body = proc do
        def list_pagination_max_limit
          7
        end
      end

      assert_equal 7, paginate({ limit: '7' }, &body).instance_variable_get(:@limit)
      assert_raises(Eluvia::Errors::UnprocessableEntity) { paginate({ limit: '8' }, &body) }
    end

    def test_host_controller_can_override_the_base_hook
      # `pagination_max_limit` comes from `Eluvia::PaginationHandler`; habarico leaves the keyword
      # out when it has nothing to say, so an application override still decides.
      body = proc do
        def pagination_max_limit
          9
        end
      end

      assert_equal 9, paginate({ limit: '9' }, &body).instance_variable_get(:@limit)
      assert_raises(Eluvia::Errors::UnprocessableEntity) { paginate({ limit: '10' }, &body) }
    end

    def test_resource_max_page_limit_wins_over_the_base_hook
      body = proc do
        def pagination_max_limit
          9
        end
      end

      assert_equal 3, paginate({ limit: '3' }, max_page_limit: 3, &body).instance_variable_get(:@limit)
      assert_raises(Eluvia::Errors::UnprocessableEntity) { paginate({ limit: '4' }, max_page_limit: 3, &body) }
    end

    # ***********************************************************************
    # Invalid and meta-only values
    # ***********************************************************************

    def test_unusable_limit_is_rejected
      %w[abc -5 1.5].each do |value|
        error = assert_raises(Eluvia::Errors::UnprocessableEntity) { paginate({ limit: value }) }
        assert_equal ['limit'], error.messages.keys, "expected a `limit` error for #{value.inspect}"
      end
    end

    def test_blank_limit_falls_back_to_the_default
      assert_equal 20, paginate({ limit: '' }).instance_variable_get(:@limit)
    end

    def test_meta_only_limit_does_not_divide_by_zero
      controller = paginate({ limit: '0', offset: '40' })

      assert_equal 0, controller.instance_variable_get(:@limit)
      assert_equal 40, controller.instance_variable_get(:@offset)
      assert_equal 1, controller.instance_variable_get(:@page)
      assert_equal 0, controller.instance_variable_get(:@padding)
    end

  end

  # *****************************************************************************
  # HAB-946 - what the resolved limit does to the Kaminari scope in `index`
  # *****************************************************************************
  class PaginationIndexTest < Minitest::Test

    # Minimal relation double for the index pipeline: filtering and ordering are identity, the
    # pagination calls are recorded, and `total_count` answers independently of the page size -
    # the same contract Kaminari has, where `per(0)` yields `limit(0)` and an unchanged count.
    class ListedRelation
      attr_reader :last_page, :last_per, :last_padding

      def filter_2!(_filter_params, current_user: nil) # rubocop:disable Lint/UnusedMethodArgument -- keyword name must match the real filter_2! interface
        self
      end

      def order(_order_by)
        self
      end

      def page(value)
        @last_page = value
        self
      end

      def per(value)
        @last_per = value
        self
      end

      def padding(value)
        @last_padding = value
        self
      end

      def total_count
        7
      end
    end

    def build_controller(params)
      relation = ListedRelation.new

      model_class = Class.new do
        define_singleton_method(:all) { relation }
        define_singleton_method(:primary_key) { 'id' }
        define_singleton_method(:permitted_filter_params) { %i[id name] }
      end

      controller_class = Class.new(ActionController::Base) do
        include Habarico::Controller

        def current_user
          nil
        end

        attr_reader :rendered_meta

        def render_list
          @rendered_meta = { limit: @limit, offset: @offset, total_count: @records.total_count }
        end
      end
      controller_class.model(model_class)
      controller_class.can_read(true)

      controller = controller_class.new
      controller.params = params
      controller
    end

    def relation_of(controller)
      controller.class.definition.model.all
    end

    def test_meta_only_request_pages_nothing_and_still_counts
      controller = build_controller({ limit: '0' })
      controller.send(:set_list_pagination)
      controller.send(:index)

      assert_equal 0, relation_of(controller).last_per
      assert_equal 1, relation_of(controller).last_page
      assert_equal({ limit: 0, offset: 0, total_count: 7 }, controller.rendered_meta)
    end

    def test_regular_request_pages_by_the_resolved_limit
      controller = build_controller({ limit: '3', offset: '6' })
      controller.send(:set_list_pagination)
      controller.send(:index)

      assert_equal 3, relation_of(controller).last_per
      assert_equal 3, relation_of(controller).last_page
      assert_equal 0, relation_of(controller).last_padding
    end

  end
end
