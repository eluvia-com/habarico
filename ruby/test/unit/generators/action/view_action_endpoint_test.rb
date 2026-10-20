require 'test_helper'

# What a view action's endpoint addresses. The action segment is the *target view's*, not the
# action's own name: a reserved view (`list` / `create` / `edit` / `show`) is addressed by its type
# and has none, so an action opening one carries no address at all - the same shape the Python
# backend emits.
class ViewActionEndpointTest < Minitest::Test

  def build_generator
    definition = Habarico::Definition.new
    definition.model = Object.new
    definition.menu_item = false
    definition.actions = []
    definition.views = [
      Habarico::ShowView.new,
      Habarico::ActionView.new(name: 'approve', is_detail: true, endpoint_action_name: 'approve', endpoint_method: :post),
    ]
    Habarico::ViewActionParametersGenerator.new(definition, %w[eshop orders])
  end

  def context
    context = Habarico::Context.new
    context.record_pk = 7
    context.define_singleton_method(:can?) { |_permission| true }
    context
  end

  def endpoint(action)
    build_generator.send(:view_action_endpoint_reference, action, context)
  end

  def test_an_action_opening_a_reserved_view_carries_no_address
    action = Habarico::ViewAction.new(name: 'show', is_detail: true, view_name: 'show')

    assert_nil endpoint(action), 'a reserved view is addressed by its type, not by an action segment'
  end

  def test_the_record_of_the_request_is_not_part_of_it
    # The frontend opens the target view for the record it already renders; an endpoint naming one
    # would be the address of another record, which the DSL has no way to express.
    action = Habarico::ViewAction.new(name: 'show', is_detail: true, view_name: 'show')

    assert_nil endpoint(action)
  end

  def test_an_action_view_is_addressed_by_its_segment
    action = Habarico::ViewAction.new(name: 'approve', is_detail: true, view_name: 'approve')
    reference = endpoint(action)

    assert_equal 'orders', reference.resource
    assert_equal 'approve', reference.action_name
    assert_nil reference.record_pk
  end

  def test_a_segment_declared_on_the_action_wins
    action = Habarico::ViewAction.new(name: 'x', view_name: 'approve', endpoint_action_name: 'publish')

    assert_equal 'publish', endpoint(action).action_name
  end

  def test_a_declared_reference_is_kept_as_written
    action = Habarico::ViewAction.new(name: 'open', view_name: 'list', endpoint_reference: 'school/teacher')
    reference = endpoint(action)

    assert_equal 'school', reference.service
    assert_equal 'teacher', reference.resource
    assert_nil reference.action_name, 'the target view is another service\'s - this one declares no segment'
  end
end
