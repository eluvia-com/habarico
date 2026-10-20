require 'test_helper'

# `ResourceReference::LIST` is the resource a surrounding box lists. A box's header toolbar renders in
# the parent's context, so a button meant for the listed resource has to name it - and this says it
# without repeating the name the box already carries.
class ListSentinelTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model
  end

  def build_definition
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    definition
  end

  def context(record_pk: nil)
    context = Habarico::Context.new
    context.record_pk = record_pk
    context.define_singleton_method(:can?) { |_permission| true }
    context
  end

  def header_descriptor(box, ctx = context)
    generator = Habarico::BoxSchemaGenerator.new(build_definition, %w[eshop orders])
    generator.send(:generate_toolbar_actions, Habarico::ShowView.new, box, 0, ctx).first
  end

  def list_box(**attrs)
    Habarico::ListBox.new(reference: 'order_items', target: 'order', **attrs)
  end

  def test_the_header_button_points_at_the_listed_resource
    box = list_box(toolbar_actions: [Habarico::ActionReference.new(name: 'create', reference: Habarico::ResourceReference::LIST)])

    reference = header_descriptor(box).reference

    assert_nil reference.service
    assert_equal 'order_items', reference.resource
  end

  def test_a_prefixed_box_reference_splits_in_two
    box = Habarico::ListBox.new(
      reference: 'eshop/order_items',
      target: 'order',
      toolbar_actions: [Habarico::ActionReference.new(name: 'create', reference: Habarico::ResourceReference::LIST)],
    )

    reference = header_descriptor(box).reference

    assert_equal 'eshop', reference.service
    assert_equal 'order_items', reference.resource
  end

  def test_the_query_of_the_boxes_schema_request_comes_along
    box = list_box(
      schema_params: { 'variant' => 'full' },
      toolbar_actions: [Habarico::ActionReference.new(name: 'create', reference: Habarico::ResourceReference::LIST)],
    )

    assert_equal({ 'variant' => 'full' }, header_descriptor(box).reference.params)
  end

  def test_the_parent_link_comes_along_on_a_record
    box = list_box(toolbar_actions: [Habarico::ActionReference.new(name: 'create', reference: Habarico::ResourceReference::LIST)])

    params = header_descriptor(box, context(record_pk: 7)).reference.params

    assert_equal '{"order":"7"}', params['_target'], 'the column the box filters by, and the parent id'
    assert_equal '{"orders":"7"}', params['_source'],
                 'the parent resource by name - a backend cannot name its own service, and the path namespace is not one'
  end

  def test_a_collection_schema_has_no_parent_to_link_to
    box = list_box(toolbar_actions: [Habarico::ActionReference.new(name: 'create', reference: Habarico::ResourceReference::LIST)])

    assert_nil header_descriptor(box).reference.params
  end

  def test_a_descriptor_naming_another_resource_is_left_alone
    box = list_box(toolbar_actions: [Habarico::ActionReference.new(name: 'create', reference: 'school/teacher')])

    reference = header_descriptor(box).reference

    assert_equal 'school', reference.service
    assert_equal 'teacher', reference.resource
  end

  def test_a_header_button_of_the_parent_carries_no_address
    box = list_box(toolbar_actions: [Habarico::ActionReference.new(name: 'refresh')])

    assert_nil header_descriptor(box).reference, 'absent means the record the surrounding view renders'
  end

  def test_a_bottom_action_resolves_it_the_same_way
    # A box's bottom actions render in the parent's context too, so they stand in the same place.
    box = list_box(bottom_actions: [Habarico::ActionReference.new(name: 'create', reference: Habarico::ResourceReference::LIST)])

    generator = Habarico::BoxSchemaGenerator.new(build_definition, %w[eshop orders])
    descriptor = generator.send(:generate_bottom_actions, Habarico::ShowView.new, box, 0, context).first

    assert_equal 'order_items', descriptor.reference.resource
  end

  def test_the_boxes_own_row_slot_resolves_it_too
    # Redundant there - these slots are read in the listed resource's schema - but not an error.
    box = list_box(row_actions: [Habarico::ActionReference.new(name: 'edit', reference: Habarico::ResourceReference::LIST)])

    generator = Habarico::ListBoxParametersGenerator.new(build_definition, %w[eshop orders])
    descriptor = generator.send(:generate_row_actions, box, context).first

    assert_equal 'order_items', descriptor.reference.resource
  end

  def test_a_click_action_resolves_it_too
    box = list_box(single_click_action: Habarico::ActionReference.new(name: 'show', reference: Habarico::ResourceReference::LIST))

    generator = Habarico::ListBoxParametersGenerator.new(build_definition, %w[eshop orders])
    descriptor = generator.send(:generate_single_click_action, box, context)

    assert_equal 'order_items', descriptor.reference.resource
  end

  def test_the_sentinel_outside_a_box_that_lists_one_is_refused
    box = Habarico::Box.new(toolbar_actions: [Habarico::ActionReference.new(name: 'create', reference: Habarico::ResourceReference::LIST)])

    error = assert_raises(StandardError) { header_descriptor(box) }
    assert_match 'not inside a list or gallery box', error.message
  end

  def test_a_box_of_another_type_has_no_address_to_stand_for
    # The DSL class carries `reference` for every box type, so the box type decides, not its presence.
    box = Habarico::Box.new(type: 'simple', reference: 'order_items',
                            toolbar_actions: [Habarico::ActionReference.new(name: 'create', reference: Habarico::ResourceReference::LIST)])

    error = assert_raises(StandardError) { header_descriptor(box) }
    assert_match 'not inside a list or gallery box', error.message
  end
end
