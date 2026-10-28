require "test_helper"

module Habarico
  # *****************************************************************************
  # HAB-915 - the `order_by` query parameter of a list endpoint.
  #
  # The notation itself (`field:direction`, exactly one `:`, a lower-case `asc`/`desc`) is
  # validated by `set_pagination` in eluvia-base, which runs first; what habarico adds is the
  # field whitelist, derived from the `sort_by` values its schema advertises.
  # *****************************************************************************
  class ControllerOrderByTest < Minitest::Test

    Column = Struct.new(:type)

    # Minimal ActiveRecord double. Only the class-level reflection the sorting whitelist reads is
    # answered, so no database connection is involved - what matters is that the class really is an
    # ActiveRecord::Base descendant, since that is what switches the whitelist on.
    def build_model(columns: %w[id name email created_at valid_from valid_to secret],
                    range_attrs: {}, order_attrs: [], associations: {})
      model = Class.new(ActiveRecord::Base)
      model.define_singleton_method(:name) { 'Product' }
      model.define_singleton_method(:primary_key) { 'id' }
      model.define_singleton_method(:columns_hash) { columns.index_with { |_column| Column.new(:string) } }
      model.define_singleton_method(:column_names) { columns }
      model.define_singleton_method(:attribute_names) { columns }
      model.define_singleton_method(:reflect_on_association) { |name| associations[name.to_sym] }

      unless range_attrs.empty?
        model.define_singleton_method(:has_range_attr?) { |attr_name| range_attrs.key?(attr_name.to_s) }
        model.define_singleton_method(:find_range_attr) { |attr_name| range_attrs[attr_name.to_s] }
      end

      unless order_attrs.empty?
        model.define_singleton_method(:order_attrs) { order_attrs.map { |attr| { attr_name: attr.to_sym } } }
      end

      model
    end

    # `reflect_on_association` answers an object exposing the associated class, the only thing the
    # association branch of the whitelist reads off a reflection.
    def association_to(model)
      reflection = Object.new
      reflection.define_singleton_method(:klass) { model }
      reflection
    end

    def author_model
      @author_model ||= build_model(columns: %w[id name salary])
    end

    # `body` is evaluated in the controller class, the way a host application declares its resource.
    def build_controller(params = {}, model: nil, &body)
      resource_model = model || build_model
      controller_class = Class.new(ActionController::Base) do
        include Habarico::Controller

        model resource_model
        fields %i[name email]
      end
      controller_class.class_eval(&body) if body

      controller = controller_class.new
      controller.params = params
      controller
    end

    # The `before_action` of `index`: `set_pagination`, then the field whitelist.
    def order_by(params = {}, model: nil, &body)
      controller = build_controller(params, model: model, &body)
      controller.send(:set_list_pagination)
      controller
    end

    def assert_rejected(params, expected_keys, model: nil, &body)
      error = assert_raises(Eluvia::Errors::UnprocessableEntity) { order_by(params, model: model, &body) }
      assert_equal expected_keys.sort, error.messages.keys.sort
      error
    end

    # ***********************************************************************
    # Notation - rejected by eluvia-base, surfaced through the list endpoint
    # ***********************************************************************

    def test_a_third_segment_is_rejected
      assert_rejected({ order_by: 'name:asc:desc' }, ['order_by'])
    end

    def test_an_upper_case_direction_is_rejected
      # Case-sensitive, the same as the Python stack - `name:ASC` used to be accepted here and
      # ordered ascending, so the two backends disagreed on the same request.
      assert_rejected({ order_by: 'name:ASC' }, ['order_by__name'])
    end

    def test_a_missing_direction_is_rejected
      assert_rejected({ order_by: 'name:' }, ['order_by__name'])
    end

    def test_a_blank_parameter_falls_back_to_the_default_sorting
      # `order_by=` used to reach `nil.to_sym` and answer 500.
      body = proc { default_sorting 'created_at:asc' }
      controller = order_by({ order_by: '' }, &body)
      assert_equal({ 'created_at' => :asc, 'id' => :asc }, controller.instance_variable_get(:@order_by))
    end

    def test_entries_are_accepted_around_whitespace
      controller = order_by({ order_by: 'name:asc, email:desc' })
      assert_equal :asc, controller.instance_variable_get(:@order_by)['name']
      assert_equal :desc, controller.instance_variable_get(:@order_by)['email']
    end

    # ***********************************************************************
    # Parameter name and force_sorting
    # ***********************************************************************

    def test_the_camel_case_parameter_is_validated_too
      original = Eluvia::Base::Config.api_case
      Eluvia::Base::Config.api_case = 'camel_case'
      assert_rejected({ orderBy: 'secret:asc' }, ['order_by__secret'])
    ensure
      Eluvia::Base::Config.api_case = original
    end

    def test_force_sorting_ignores_the_parameter_instead_of_refusing_it
      # `set_pagination` drops the parameter entirely when sorting is forced, so refusing the
      # request here would refuse one the backend is going to serve anyway.
      body = proc do
        default_sorting 'created_at:asc'
        force_sorting true
      end
      controller = order_by({ order_by: 'secret:asc' }, &body)
      assert_equal({ 'created_at' => :asc, 'id' => :asc }, controller.instance_variable_get(:@order_by))
    end

    # ***********************************************************************
    # Field whitelist
    # ***********************************************************************

    def test_nothing_declared_orders_by_the_primary_key_alone
      # No column is assumed to exist - `created_at:asc` used to be the built-in default, so a
      # model without that column answered 422 on a request that asked for no ordering at all.
      model = build_model(columns: %w[id name])
      controller = order_by({}, model: model)

      assert_equal({ 'id' => :asc }, controller.instance_variable_get(:@order_by))
    end

    def test_a_declared_field_is_accepted
      controller = order_by({ order_by: 'name:desc' })
      assert_equal :desc, controller.instance_variable_get(:@order_by)['name']
    end

    def test_a_column_that_is_not_a_declared_field_is_refused
      assert_rejected({ order_by: 'secret:asc' }, ['order_by__secret'])
    end

    def test_every_unknown_field_is_reported_in_one_response
      error = assert_rejected({ order_by: 'secret:asc,missing:desc' }, %w[order_by__secret order_by__missing])
      assert_equal 'Unknown field name.', error.messages['order_by__secret']
    end

    def test_the_lower_bound_of_a_range_field_is_accepted
      model = build_model(range_attrs: { 'validity' => { lower_attr_name: :valid_from } })
      body = proc { fields %i[name validity] }
      controller = order_by({ order_by: 'valid_from:asc' }, model: model, &body)
      assert_equal :asc, controller.instance_variable_get(:@order_by)['valid_from']
    end

    def test_a_sort_by_declared_on_a_field_reference_is_accepted
      body = proc do
        fields [Habarico::FieldReference.new(name: :name, sort_by: 'email')]
      end
      controller = order_by({ order_by: 'email:asc' }, &body)
      assert_equal :asc, controller.instance_variable_get(:@order_by)['email']
    end

    def test_a_sort_by_declared_with_a_dot_is_accepted_in_the_form_the_frontend_sends_it
      # The frontend rewrites the first `.` of a `sort_by` into `__` before it puts the value in
      # `order_by` (`serializeOrderBy`), so that is the form the whitelist has to recognise.
      body = proc do
        fields [Habarico::FieldReference.new(name: :name, sort_by: 'author.name')]
      end
      controller = order_by({ order_by: 'author__name:asc' }, &body)
      assert_equal :asc, controller.instance_variable_get(:@order_by)['author__name']
    end

    def test_an_association_column_declared_in_a_list_view_is_accepted
      model = build_model(associations: { author: association_to(author_model) })
      body = proc do
        views [Habarico::ListView.new(boxes: [Habarico::FieldReference.new(name: 'author__name')])]
      end
      controller = order_by({ order_by: 'author__name:asc' }, model: model, &body)
      assert_equal :asc, controller.instance_variable_get(:@order_by)['author__name']
    end

    def test_an_association_column_nobody_declared_is_refused
      model = build_model(associations: { author: association_to(author_model) })
      assert_rejected({ order_by: 'author__salary:asc' }, ['order_by__author__salary'], model: model)
    end

    def test_a_virtual_column_registered_with_order_attr_is_accepted
      model = build_model(order_attrs: %i[popularity])
      controller = order_by({ order_by: 'popularity:desc' }, model: model)
      assert_equal :desc, controller.instance_variable_get(:@order_by)['popularity']
    end

    def test_sorting_fields_stays_the_hard_whitelist
      body = proc { sorting_fields %i[email] }
      controller = order_by({ order_by: 'email:asc' }, &body)
      assert_equal :asc, controller.instance_variable_get(:@order_by)['email']

      assert_rejected({ order_by: 'name:asc' }, ['order_by__name'], &body)
    end

    # ***********************************************************************
    # What the schema itself tells the frontend to sort by
    # ***********************************************************************

    def test_the_default_sorting_is_accepted_without_being_a_declared_field
      # The list view schema publishes `default_sorting`, the frontend puts it in `order_by` on the
      # first request, and the whitelist used to refuse it unless the field was declared too.
      body = proc { default_sorting 'created_at:asc' }
      controller = order_by({ order_by: 'created_at:desc' }, &body)

      assert_equal :desc, controller.instance_variable_get(:@order_by)['created_at']
    end

    def test_a_sorting_a_list_view_publishes_is_accepted
      body = proc do
        default_sorting 'name:asc'
        views [Habarico::ListView.new(default_sorting: 'email:desc')]
      end
      controller = order_by({ order_by: 'email:desc' }, &body)

      assert_equal :desc, controller.instance_variable_get(:@order_by)['email']
    end

    def test_the_primary_key_is_accepted
      # `serializeOrderBy` falls back to the resource's primary key when the list has no sort of
      # its own, so this is what an untouched list sends.
      controller = order_by({ order_by: 'id:asc' })

      assert_equal :asc, controller.instance_variable_get(:@order_by)['id']
    end

    def test_sorting_fields_still_accepts_what_the_resource_orders_by_anyway
      # A hard whitelist bounds what a *client* may choose; refusing the ordering the backend
      # applies to every request regardless would only refuse its own answer.
      body = proc do
        default_sorting 'created_at:asc'
        sorting_fields %i[email]
      end
      controller = order_by({ order_by: 'created_at:asc,id:asc' }, &body)

      assert_equal :asc, controller.instance_variable_get(:@order_by)['created_at']
      assert_rejected({ order_by: 'name:asc' }, ['order_by__name'], &body)
    end

    # ***********************************************************************
    # The primary key behind the ordering
    # ***********************************************************************

    def test_the_primary_key_is_ordered_by_behind_the_request
      controller = order_by({ order_by: 'name:desc' })

      assert_equal({ 'name' => :desc, 'id' => :asc }, controller.instance_variable_get(:@order_by))
    end

    def test_a_request_already_sorting_by_the_primary_key_keeps_its_direction
      # The primary key reaches `set_pagination` as `fallback_order_by`, which never overrides a
      # direction the request already sets.
      controller = order_by({ order_by: 'id:desc' })

      assert_equal({ 'id' => :desc }, controller.instance_variable_get(:@order_by))
    end

    def test_a_model_without_a_created_at_column_can_be_listed
      # `created_at:asc` was appended to every list, hardcoded, so a model without that column
      # answered 422 on every request instead of the one asking to sort by it.
      model = build_model(columns: %w[id name])
      controller = order_by({ order_by: 'name:asc' }, model: model)

      assert_equal({ 'name' => :asc, 'id' => :asc }, controller.instance_variable_get(:@order_by))
    end

    def test_a_composite_primary_key_breaks_the_tie_on_both_columns
      model = build_model
      model.define_singleton_method(:primary_key) { %w[tenant_id id] }
      controller = order_by({ order_by: 'name:asc' }, model: model)

      assert_equal({ 'name' => :asc, 'tenant_id' => :asc, 'id' => :asc },
        controller.instance_variable_get(:@order_by))
    end

    def test_a_model_without_a_primary_key_is_ordered_by_what_it_asked_for_alone
      model = build_model
      model.define_singleton_method(:primary_key) { nil }
      controller = order_by({ order_by: 'name:asc' }, model: model)

      assert_equal({ 'name' => :asc }, controller.instance_variable_get(:@order_by))
    end

    def test_a_model_without_reflection_is_left_to_itself
      # A non-ActiveRecord model exposes no columns to check against, so habarico has no whitelist
      # to apply and leaves the field names to the model.
      controller = order_by({ order_by: 'anything:asc' }, model: Class.new)
      assert_equal :asc, controller.instance_variable_get(:@order_by)['anything']
    end

  end
end
