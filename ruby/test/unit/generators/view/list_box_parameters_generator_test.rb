require 'test_helper'

class ListBoxParametersGeneratorTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model.define_singleton_method(:model_name) { ActiveModel::Name.new(model, nil, 'Thing') }
    model.define_singleton_method(:i18n_scope) { :activerecord }
    model.define_singleton_method(:columns_hash) { {} }
    model.define_singleton_method(:reflect_on_association) { |_| nil }
    model
  end

  def stub_context(can_read: true)
    ctx = Object.new
    ctx.define_singleton_method(:can?) { |_permission| can_read }
    ctx
  end

  def build_definition
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.label = 'Things'
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    definition
  end

  def build_box(attrs = {})
    box = Habarico::ListBox.new
    box.reference = attrs.fetch(:reference, 'items')
    box.target = attrs.fetch(:target, 'parent_id')
    box.sortable_field_name = attrs[:sortable_field_name]
    box.sortable_sort_for_filters = attrs[:sortable_sort_for_filters]
    box.schema_params = attrs[:schema_params]
    box.single_click_action = attrs[:single_click_action]
    box.double_click_action = attrs[:double_click_action]
    # Only assigned when the test says so: an unmentioned slot carries the resource's defaults
    box.row_actions = attrs[:row_actions] if attrs.key?(:row_actions)
    box.list_actions = attrs[:list_actions] if attrs.key?(:list_actions)
    box
  end

  def build_generator
    Habarico::ListBoxParametersGenerator.new(build_definition, ['things'])
  end

  # -------------------------------------------------------------------------
  # Schema attribute tests
  # -------------------------------------------------------------------------

  def test_generate_sortable_returns_nil_by_default
    generator = build_generator
    box = build_box
    assert_nil generator.send(:generate_sortable, box, stub_context)
  end

  def test_generate_sortable_returns_list_box_sortable_parameters_when_field_name_set
    generator = build_generator
    box = build_box(sortable_field_name: 'position')
    result = generator.send(:generate_sortable, box, stub_context)
    assert_instance_of Habarico::SortableParameters, result
    assert_equal 'position', result.field_name
    assert_nil result.sort_for_filters
  end

  def test_generate_sortable_includes_sort_for_filters
    generator = build_generator
    box = build_box(sortable_field_name: 'position', sortable_sort_for_filters: { category_id: 1 })
    result = generator.send(:generate_sortable, box, stub_context)
    assert_equal 'position', result.field_name
    assert_equal({ category_id: 1 }, result.sort_for_filters)
  end

  def test_the_reference_addresses_the_listed_resource
    reference = build_generator.send(:generate_reference, build_box, stub_context)
    assert_nil reference.service
    assert_equal 'items', reference.resource
    assert_nil reference.params
  end

  def test_schema_params_travel_inside_the_reference
    box = build_box(schema_params: { view: 'compact' })
    assert_equal({ view: 'compact' }, build_generator.send(:generate_reference, box, stub_context).params)
  end

  def test_generate_single_click_action_returns_nil_by_default
    generator = build_generator
    box = build_box
    assert_nil generator.send(:generate_single_click_action, box, stub_context)
  end

  def test_generate_double_click_action_returns_nil_by_default
    generator = build_generator
    box = build_box
    assert_nil generator.send(:generate_double_click_action, box, stub_context)
  end

  def test_generate_single_click_action_normalizes_string_to_descriptor
    generator = build_generator
    box = build_box(single_click_action: 'show')
    result = generator.send(:generate_single_click_action, box, stub_context)
    assert_instance_of Habarico::ActionDescriptor, result
    assert_equal 'show', result.name
  end

  def test_generate_double_click_action_normalizes_string_to_descriptor
    generator = build_generator
    box = build_box(double_click_action: 'edit')
    result = generator.send(:generate_double_click_action, box, stub_context)
    assert_instance_of Habarico::ActionDescriptor, result
    assert_equal 'edit', result.name
  end

  # -------------------------------------------------------------------------
  # Toolbar / list actions (two independent table slots)
  # -------------------------------------------------------------------------

  def test_the_second_toolbar_is_gone
    refute Habarico::ListBox.new.respond_to?(:list_toolbar_actions=), 'a list box has one toolbar, the box\'s own'
    refute Habarico::ListBoxParameters.new.respond_to?(:toolbar_actions)
  end

  # A slot the author never mentioned carries the listed resource's own actions, which the client
  # expands; the entry names no resource, since these slots are read in that resource's schema.
  def test_row_actions_default_to_the_listed_records_own
    result = build_generator.send(:generate_row_actions, build_box, stub_context)
    assert_equal 'default_actions', result.first.type
    assert_equal 'detail', result.first.scope
    assert_nil result.first.reference
  end

  def test_list_actions_default_to_the_collections_own
    result = build_generator.send(:generate_list_actions, build_box, stub_context)
    assert_equal 'default_actions', result.first.type
    assert_equal 'list', result.first.scope
  end

  def test_nil_turns_a_boxes_default_off
    assert_nil build_generator.send(:generate_row_actions, build_box(row_actions: nil), stub_context)
  end

  def test_an_explicitly_empty_slot_stays_empty
    assert_equal [], build_generator.send(:generate_list_actions, build_box(list_actions: []), stub_context)
  end

  def test_generate_list_actions_returns_descriptors_when_configured
    generator = build_generator
    box = build_box(list_actions: [Habarico::ActionReference.new(name: 'export')])
    result = generator.send(:generate_list_actions, box, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::ActionDescriptor, result.first
    assert_equal 'export', result.first.name
  end

  def test_a_declared_slot_is_left_as_declared
    generator = build_generator
    box = build_box(list_actions: [Habarico::ActionReference.new(name: 'export')])
    result = generator.generate(box, stub_context)
    assert_equal ['export'], result.list_actions.map(&:name)
    assert_equal ['action'], result.list_actions.map(&:type)
  end

  # -------------------------------------------------------------------------
  # Full generate output tests
  # -------------------------------------------------------------------------

  def test_generate_produces_list_box_parameters
    generator = build_generator
    box = build_box
    result = generator.generate(box, stub_context)
    assert_instance_of Habarico::ListBoxParameters, result
  end

  def test_generate_schema_has_sortable_when_field_name_set
    generator = build_generator
    box = build_box(sortable_field_name: 'position', sortable_sort_for_filters: { category_id: 2 })
    result = generator.generate(box, stub_context)
    assert_instance_of Habarico::SortableParameters, result.sortable
    assert_equal 'position', result.sortable.field_name
    assert_equal({ category_id: 2 }, result.sortable.sort_for_filters)
  end

  def test_generate_schema_has_no_sortable_when_field_name_not_set
    generator = build_generator
    box = build_box
    result = generator.generate(box, stub_context)
    assert_nil result.sortable
  end

  def test_generate_schema_carries_the_query_inside_the_reference
    generator = build_generator
    box = build_box(schema_params: { mode: 'embedded' })
    result = generator.generate(box, stub_context)
    assert_equal({ mode: 'embedded' }, result.reference.params)
    assert_equal 'items', result.reference.resource
  end

  def test_generate_schema_has_single_click_action
    generator = build_generator
    box = build_box(single_click_action: 'show')
    result = generator.generate(box, stub_context)
    assert_instance_of Habarico::ActionDescriptor, result.single_click_action
    assert_equal 'show', result.single_click_action.name
  end

  def test_generate_schema_has_double_click_action
    generator = build_generator
    box = build_box(double_click_action: 'edit')
    result = generator.generate(box, stub_context)
    assert_instance_of Habarico::ActionDescriptor, result.double_click_action
    assert_equal 'edit', result.double_click_action.name
  end

end
