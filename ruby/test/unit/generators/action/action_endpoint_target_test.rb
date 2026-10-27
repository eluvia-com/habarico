require 'test_helper'

# An action may name its own target - another resource through `endpoint_reference`,
# another record through `endpoint_record_pk`. Both must beat the record in the context and reach
# the generated endpoint, in the `view` and the `resource` variant alike.
class ActionEndpointTargetTest < Minitest::Test

  PRODUCT_PK = '11111111-1111-4111-8111-111111111111'.freeze
  CATEGORY_PK = '22222222-2222-4222-8222-222222222222'.freeze

  def stub_context(record_pk: PRODUCT_PK)
    ctx = Object.new
    ctx.define_singleton_method(:record_pk) { record_pk }
    ctx.define_singleton_method(:can?) { |_permission| true }
    ctx
  end

  def build_definition
    definition = Habarico::Definition.new
    definition.model = Object.new
    definition.label = 'Products'
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    definition
  end

  def setup
    @previous_resources = Habarico::Config.resources
    Habarico::Config.resources = %i[products categories]
  end

  def teardown
    Habarico::Config.resources = @previous_resources
  end

  # ---------------------------------------------------------------------------
  # view endpoint
  # ---------------------------------------------------------------------------

  def view_endpoint(action, context = stub_context)
    Habarico::ViewActionEndpointParametersGenerator.new(build_definition, ['products']).generate(action, context)
  end

  def test_view_record_pk_falls_back_to_the_context
    action = Habarico::ViewAction.new(name: 'edit_price', is_detail: true)
    assert_equal PRODUCT_PK, view_endpoint(action).record_pk
  end

  def test_view_record_pk_prefers_the_explicit_one
    action = Habarico::ViewAction.new(name: 'edit_price', is_detail: true, endpoint_record_pk: CATEGORY_PK)
    assert_equal CATEGORY_PK, view_endpoint(action).record_pk
  end

  def test_view_record_pk_is_used_even_without_is_detail
    action = Habarico::ViewAction.new(name: 'edit_price', is_detail: false, endpoint_record_pk: CATEGORY_PK)
    assert_equal CATEGORY_PK, view_endpoint(action).record_pk
  end

  def test_view_action_name_is_omitted_for_a_standard_action
    action = Habarico::ViewAction.new(name: 'show', is_detail: true, endpoint_reference: 'categories')
    assert_nil view_endpoint(action).action_name
  end

  def test_view_action_name_keeps_an_explicit_endpoint_action_name
    action = Habarico::ViewAction.new(name: 'show', is_detail: true, endpoint_action_name: 'show_archived')
    assert_equal 'show_archived', view_endpoint(action).action_name
  end

  # ---------------------------------------------------------------------------
  # view parameters - the endpoint is kept for a standard action with a target
  # ---------------------------------------------------------------------------

  def view_parameters(action, context = stub_context)
    Habarico::ViewActionParametersGenerator.new(build_definition, ['products']).generate(action, context)
  end

  def test_standard_view_action_without_a_target_has_no_endpoint
    action = Habarico::ViewAction.new(name: 'show', view_name: 'show', is_detail: true)
    assert_nil view_parameters(action).endpoint
  end

  def test_standard_view_action_with_a_target_keeps_its_endpoint
    action = Habarico::ViewAction.new(name: 'show', view_name: 'show', is_detail: true,
                                      endpoint_reference: 'categories', endpoint_record_pk: CATEGORY_PK)
    endpoint = view_parameters(action).endpoint

    assert_equal 'categories', endpoint.reference
    assert_equal CATEGORY_PK, endpoint.record_pk
  end

  def test_view_choices_are_generated
    action = Habarico::ViewAction.new(
      name: 'report', view_name: 'report',
      view_choices: [Habarico::ActionViewChoice.new(label: 'Current quarter', parameters: { 'period' => 'quarter' })]
    )

    assert_equal ['Current quarter'], view_parameters(action).choices.map(&:label)
  end

  def test_view_choices_are_resolved_from_a_callable
    action = Habarico::ViewAction.new(
      name: 'report', view_name: 'report',
      view_choices: ->(_context) { [Habarico::ActionViewChoice.new(label: 'Current quarter')] }
    )

    assert_equal ['Current quarter'], view_parameters(action).choices.map(&:label)
  end

  # ---------------------------------------------------------------------------
  # resource endpoint
  # ---------------------------------------------------------------------------

  def resource_endpoint(action, context = stub_context)
    Habarico::ResourceActionEndpointParametersGenerator.new(build_definition, ['products']).generate(action, context)
  end

  def test_resource_path_uses_the_context_record_by_default
    action = Habarico::ResourceAction.new(name: 'publish', endpoint_method: :put, is_detail: true)
    assert_equal "/products/#{PRODUCT_PK}/publish/", resource_endpoint(action).path
  end

  def test_resource_path_points_at_the_referenced_resource_and_record
    action = Habarico::ResourceAction.new(name: 'recount', endpoint_method: :put, is_detail: true,
                                         endpoint_reference: 'categories', endpoint_record_pk: CATEGORY_PK)
    endpoint = resource_endpoint(action)

    assert_equal "/categories/#{CATEGORY_PK}/recount/", endpoint.path
    assert_equal CATEGORY_PK, endpoint.record_pk
  end

  def test_standard_resource_action_without_a_target_has_no_path
    action = Habarico::DeleteAction.new
    assert_nil resource_endpoint(action).path
  end

  def test_standard_resource_action_with_a_target_gets_the_standard_path_of_that_resource
    action = Habarico::DeleteAction.new(endpoint_reference: 'categories', endpoint_record_pk: CATEGORY_PK)
    endpoint = resource_endpoint(action)

    assert_equal "/categories/#{CATEGORY_PK}/", endpoint.path
    assert_nil endpoint.action_name
  end

  def test_resource_path_raises_for_an_unregistered_reference
    action = Habarico::ResourceAction.new(name: 'recount', endpoint_method: :put, endpoint_reference: 'suppliers')

    error = assert_raises(Eluvia::Errors::StandardError) { resource_endpoint(action) }
    assert_includes error.message, 'suppliers'
  end

end
