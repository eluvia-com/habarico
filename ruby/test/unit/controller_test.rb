require "test_helper"

module Habarico
  # *****************************************************************************
  # show - HAB-899: read-by-id must respect can_read, same as index
  # *****************************************************************************

  class ShowPermissionTest < Minitest::Test

    def build_controller(read_allowed: true, allow_read_by_id: false)
      controller_class = Class.new(ActionController::Base) do
        include Habarico::Controller

        model Object

        def current_user
          nil
        end

        def render_detail
          @rendered = true
        end

        def rendered?
          !!@rendered
        end
      end
      controller_class.can_read(read_allowed)
      controller_class.allow_read_by_id(true) if allow_read_by_id
      controller_class.new
    end

    def test_show_allowed_by_default_when_can_read_true
      controller = build_controller(read_allowed: true)
      controller.send(:show)
      assert controller.rendered?
    end

    def test_show_forbidden_when_can_read_false
      controller = build_controller(read_allowed: false)
      assert_raises(Eluvia::Errors::Forbidden) { controller.send(:show) }
      refute controller.rendered?
    end

    def test_show_allowed_without_read_when_allow_read_by_id
      controller = build_controller(read_allowed: false, allow_read_by_id: true)
      controller.send(:show)
      assert controller.rendered?
    end

  end

  # *****************************************************************************
  # index - can_read now forbids listing outright; allow_read_by_id restores the
  # explicit id__in-only fallback (cross-service references)
  # *****************************************************************************

  class IndexReadPermissionTest < Minitest::Test

    # Minimal relation double for the index pipeline: `filter_2!` records the params it received
    # and applies the `id__in` restriction; ordering and pagination are identity.
    class ListedRelation
      attr_reader :ids, :last_filter_params

      def initialize(ids)
        @ids = ids
      end

      def filter_2!(filter_params, current_user: nil) # rubocop:disable Lint/UnusedMethodArgument -- keyword name must match the real filter_2! interface
        @last_filter_params = filter_params
        return self unless filter_params.key?(:id__in)

        @ids &= Array(filter_params[:id__in]).map(&:to_i)
        self
      end

      def order(_order_by)
        self
      end

      def page(_page)
        self
      end

      def per(_limit)
        self
      end

      def padding(_padding)
        self
      end
    end

    def build_controller(read_allowed:, allow_read_by_id: false)
      relation = ListedRelation.new([1, 2, 3])

      model_class = Class.new do
        define_singleton_method(:all) { relation }
        define_singleton_method(:primary_key) { 'id' }
        define_singleton_method(:permitted_filter_params) { %i[id id__in title] }
        # Same `field=<json>` grammar as the base library, lenient like `raise_on_invalid: false`.
        define_singleton_method(:parse_filter_term) do |term, raise_on_invalid: true| # rubocop:disable Lint/UnusedBlockArgument -- keyword name must match the real parse_filter_term interface
          term.to_s.split('&').to_h do |t|
            field, raw = t.split('=', 2)
            [field, JSON.parse(raw)]
          end
        end
      end

      controller_class = Class.new(ActionController::Base) do
        include Habarico::Controller

        def current_user
          nil
        end

        attr_reader :rendered_ids

        def render_list(_search_query = nil)
          @rendered_ids = @records.ids
        end
      end
      controller_class.model(model_class)
      controller_class.filters(%i[title])
      controller_class.can_read(read_allowed)
      controller_class.allow_read_by_id(true) if allow_read_by_id
      controller_class.new
    end

    def relation_of(controller)
      controller.class.definition.model.all
    end

    def test_index_forbidden_without_read_permission
      controller = build_controller(read_allowed: false)
      controller.params = {}
      assert_raises(Eluvia::Errors::Forbidden) { controller.send(:index) }
      assert_nil controller.rendered_ids
    end

    def test_index_allowed_with_read_permission
      controller = build_controller(read_allowed: true)
      controller.params = { filter: 'id__in=[1,3]&title="x"' }
      controller.send(:index)
      # Unrestricted branch: the whole filter string reaches filter_2! untouched.
      assert_equal({ filter: 'id__in=[1,3]&title="x"' }, relation_of(controller).last_filter_params)
    end

    def test_index_returns_only_id_in_matches_without_read_when_allow_read_by_id
      controller = build_controller(read_allowed: false, allow_read_by_id: true)
      controller.params = { filter: 'id__in=[1,3]&title="x"' }
      controller.send(:index)
      assert_equal [1, 3], controller.rendered_ids
      # Everything except id__in must be dropped - the title term never reaches filter_2!.
      assert_equal({ id__in: [1, 3] }, relation_of(controller).last_filter_params)
    end

    def test_index_returns_empty_without_ids_when_allow_read_by_id
      controller = build_controller(read_allowed: false, allow_read_by_id: true)
      controller.params = {}
      controller.send(:index)
      assert_equal [], controller.rendered_ids
    end

  end

  # *****************************************************************************
  # set_record - HAB-899: policy_scope must be applied like index, not skipped
  # *****************************************************************************

  class SetRecordPolicyScopeTest < Minitest::Test

    class ScopedRecord
      attr_reader :id

      def initialize(id)
        @id = id
      end
    end

    # Minimal relation double: supports `.all`, `.only` (stand-in for a Pundit policy scope
    # narrowing), `.filter_2` (default_filter, identity here) and `.find`.
    class ScopedRelation
      def self.all
        new([1, 2, 3])
      end

      def initialize(ids)
        @ids = ids
      end

      def only(ids)
        ScopedRelation.new(@ids & ids)
      end

      def filter_2(_default_filter, current_user: nil) # rubocop:disable Lint/UnusedMethodArgument -- keyword name must match the real filter_2 interface
        self
      end

      def find(pk)
        pk = pk.to_i
        raise ActiveRecord::RecordNotFound, "not found" unless @ids.include?(pk)

        ScopedRecord.new(pk)
      end
    end

    class ScopedModel
      def self.all
        ScopedRelation.all
      end
    end

    def build_controller(with_policy_scope:)
      controller_class = Class.new(ActionController::Base) do
        include Habarico::Controller

        model ScopedModel

        def current_user
          nil
        end
      end
      controller_class.policy_scope(->(records, _c) { records.only([1, 2]) }) if with_policy_scope
      controller_class.new
    end

    def test_set_record_finds_record_inside_policy_scope
      controller = build_controller(with_policy_scope: true)
      controller.params = { id: "2" }
      controller.send(:set_record)
      assert_equal 2, controller.instance_variable_get(:@record).id
    end

    def test_set_record_raises_for_record_outside_policy_scope
      controller = build_controller(with_policy_scope: true)
      controller.params = { id: "3" }
      assert_raises(ActiveRecord::RecordNotFound) { controller.send(:set_record) }
    end

    def test_set_record_finds_any_record_without_policy_scope
      controller = build_controller(with_policy_scope: false)
      controller.params = { id: "3" }
      controller.send(:set_record)
      assert_equal 3, controller.instance_variable_get(:@record).id
    end

  end
end
