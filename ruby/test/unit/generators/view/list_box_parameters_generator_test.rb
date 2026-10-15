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
    box.list_toolbar_actions = attrs[:list_toolbar_actions]
    box.list_actions = attrs[:list_actions]
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

  def test_generate_schema_params_returns_nil_by_default
    generator = build_generator
    box = build_box
    assert_nil generator.send(:generate_schema_params, box, stub_context)
  end

  def test_generate_schema_params_returns_value
    generator = build_generator
    box = build_box(schema_params: { view: 'compact' })
    assert_equal({ view: 'compact' }, generator.send(:generate_schema_params, box, stub_context))
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

  def test_generate_toolbar_actions_returns_nil_by_default
    generator = build_generator
    box = build_box
    assert_nil generator.send(:generate_toolbar_actions, box, stub_context)
  end

  def test_generate_toolbar_actions_is_fed_by_list_toolbar_actions
    generator = build_generator
    box = build_box(list_toolbar_actions: [Habarico::ActionReference.new(name: 'create')])
    result = generator.send(:generate_toolbar_actions, box, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::ActionDescriptor, result.first
    assert_equal 'create', result.first.name
  end

  def test_generate_list_actions_returns_nil_by_default
    generator = build_generator
    box = build_box
    assert_nil generator.send(:generate_list_actions, box, stub_context)
  end

  def test_generate_list_actions_returns_descriptors_when_configured
    generator = build_generator
    box = build_box(list_actions: [Habarico::ActionReference.new(name: 'export')])
    result = generator.send(:generate_list_actions, box, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::ActionDescriptor, result.first
    assert_equal 'export', result.first.name
  end

  def test_generate_schema_has_independent_toolbar_and_list_actions
    generator = build_generator
    box = build_box(
      list_toolbar_actions: [Habarico::ActionReference.new(name: 'create')],
      list_actions: [Habarico::ActionReference.new(name: 'export')],
    )
    result = generator.generate(box, stub_context)
    assert_equal ['create'], result.toolbar_actions.map(&:name)
    assert_equal ['export'], result.list_actions.map(&:name)
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

  def test_generate_schema_has_schema_params
    generator = build_generator
    box = build_box(schema_params: { mode: 'embedded' })
    result = generator.generate(box, stub_context)
    assert_equal({ mode: 'embedded' }, result.schema_params)
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
