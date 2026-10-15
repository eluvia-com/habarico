require 'test_helper'

class ActionDescriptorGeneratorTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model.define_singleton_method(:model_name) { ActiveModel::Name.new(model, nil, 'Thing') }
    model.define_singleton_method(:i18n_scope) { :activerecord }
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

  def build_generator
    Habarico::ActionDescriptorGenerator.new(build_definition, ['things'])
  end

  def action_ref(attrs = {})
    ref = Habarico::ActionReference.new(name: attrs.fetch(:name, 'my_action'))
    ref.permission = nil
    ref.view_mode = attrs[:view_mode]
    ref.view_choices = attrs[:view_choices]
    ref.view_parameters = attrs[:view_parameters]
    ref.view_keep_linked_parent = attrs[:view_keep_linked_parent]
    ref.menu_items = attrs[:menu_items]
    ref
  end

  # -------------------------------------------------------------------------
  # generate_view tests
  # -------------------------------------------------------------------------

  def test_generate_view_returns_nil_by_default
    generator = build_generator
    ref = action_ref
    assert_nil generator.send(:generate_view, ref, stub_context)
  end

  def test_generate_view_returns_parameters_when_mode_set
    generator = build_generator
    ref = action_ref(view_mode: 'redirect')
    result = generator.send(:generate_view, ref, stub_context)
    refute_nil result
    assert_instance_of Habarico::ViewActionDescriptorParameters, result
    assert_equal 'redirect', result.mode
  end

  def test_generate_view_returns_parameters_when_choices_set
    generator = build_generator
    choices = [{ name: 'view_a' }]
    ref = action_ref(view_choices: choices)
    result = generator.send(:generate_view, ref, stub_context)
    refute_nil result
    assert_equal choices, result.choices
  end

  def test_generate_view_returns_parameters_when_view_parameters_set
    generator = build_generator
    params = { locale: 'cs' }
    ref = action_ref(view_parameters: params)
    result = generator.send(:generate_view, ref, stub_context)
    refute_nil result
    assert_equal params, result.parameters
  end

  def test_generate_view_returns_parameters_when_keep_linked_parent_set
    generator = build_generator
    ref = action_ref(view_keep_linked_parent: true)
    result = generator.send(:generate_view, ref, stub_context)
    refute_nil result
    assert_equal true, result.keep_linked_parent
  end

  def test_generate_view_passes_keep_linked_parent_false
    generator = build_generator
    ref = action_ref(view_keep_linked_parent: false)
    result = generator.send(:generate_view, ref, stub_context)
    refute_nil result
    assert_equal false, result.keep_linked_parent
  end

  # -------------------------------------------------------------------------
  # generate_menu_items tests
  # -------------------------------------------------------------------------

  def test_generate_menu_items_returns_nil_by_default
    generator = build_generator
    ref = action_ref
    assert_nil generator.send(:generate_menu_items, ref, stub_context)
  end

  def test_generate_menu_items_converts_strings
    generator = build_generator
    item_ref = Habarico::ActionReference.new(name: 'sub_action')
    item_ref.permission = nil
    ref = action_ref(menu_items: [item_ref])
    result = generator.send(:generate_menu_items, ref, stub_context)
    refute_nil result
    assert_equal 1, result.length
    assert_equal 'sub_action', result[0].name
  end

  # -------------------------------------------------------------------------
  # Full generate output tests
  # -------------------------------------------------------------------------

  def test_generate_produces_action_descriptor
    generator = build_generator
    ref = action_ref
    result = generator.generate(ref, stub_context)
    assert_instance_of Habarico::ActionDescriptor, result
  end

  def test_generate_schema_has_view_when_mode_set
    generator = build_generator
    ref = action_ref(view_mode: 'dialog')
    result = generator.generate(ref, stub_context)
    refute_nil result.view
    assert_equal 'dialog', result.view.mode
  end

  def test_generate_schema_has_no_view_by_default
    generator = build_generator
    ref = action_ref
    result = generator.generate(ref, stub_context)
    assert_nil result.view
  end

  def test_generate_schema_has_menu_items
    generator = build_generator
    sub_ref = Habarico::ActionReference.new(name: 'child_action')
    sub_ref.permission = nil
    ref = action_ref(menu_items: [sub_ref])
    result = generator.generate(ref, stub_context)
    refute_nil result.menu_items
    assert_equal 1, result.menu_items.length
    assert_equal 'child_action', result.menu_items[0].name
  end

  def test_generate_schema_has_no_menu_items_by_default
    generator = build_generator
    ref = action_ref
    result = generator.generate(ref, stub_context)
    assert_nil result.menu_items
  end

end
