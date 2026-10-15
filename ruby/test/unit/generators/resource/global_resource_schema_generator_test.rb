require 'test_helper'

class GlobalResourceSchemaGeneratorTest < Minitest::Test

  def stub_model(pk = 'id')
    model = Object.new
    model.define_singleton_method(:primary_key) { pk }
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
    definition = build_definition
    Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
  end

  # *****************************************************************************
  # Private method tests
  # *****************************************************************************

  # *****************************************************************************
  # Full generate output tests
  # *****************************************************************************

  def test_generate_schema_returns_global_resource_schema_instance
    schema = build_generator.generate(stub_context)
    assert_instance_of Habarico::GlobalResourceSchema, schema
  end

  def test_generate_schema_has_correct_name
    schema = build_generator.generate(stub_context)
    assert_equal 'things', schema.name
  end

  def test_generate_schema_has_correct_label
    schema = build_generator.generate(stub_context)
    assert_equal 'Things', schema.label
  end

  def test_generate_schema_has_correct_pk_field_name
    schema = build_generator.generate(stub_context)
    assert_equal 'id', schema.pk_field_name
  end

  # *****************************************************************************
  # generate_actions tests
  # *****************************************************************************

  def test_generate_actions_returns_empty_array_when_no_actions_defined
    generator = build_generator
    result = generator.send(:generate_actions, stub_context)
    assert_equal [], result
  end

  def test_generate_actions_returns_action_schemas_for_permitted_actions
    definition = build_definition
    definition.actions = [:show]
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_actions, stub_context(can_read: true))
    assert_equal 1, result.size
    assert_instance_of Habarico::GlobalResourceActionSchema, result[0]
    assert_equal 'show', result[0].name
  end

  def test_generate_actions_filters_out_denied_actions
    definition = build_definition
    definition.actions = [:show]
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_actions, stub_context(can_read: false))
    assert_equal [], result
  end

  def test_generate_actions_returns_multiple_action_schemas
    definition = build_definition
    definition.actions = %i[show create]
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_actions, stub_context(can_read: true))
    assert_equal 2, result.size
    assert_equal 'show', result[0].name
    assert_equal 'create', result[1].name
  end

  def test_generate_schema_actions_are_empty_by_default
    schema = build_generator.generate(stub_context)
    assert_equal [], schema.actions
  end

  def test_generate_schema_actions_include_permitted_action_schemas
    definition = build_definition
    definition.actions = [:show]
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    schema = generator.generate(stub_context(can_read: true))
    assert_equal 1, schema.actions.size
    assert_instance_of Habarico::GlobalResourceActionSchema, schema.actions[0]
  end

  # *****************************************************************************
  # generate_views tests
  # *****************************************************************************

  def test_generate_views_returns_empty_array_when_no_views_defined
    generator = build_generator
    result = generator.send(:generate_views, stub_context)
    assert_equal [], result
  end

  def test_generate_views_returns_view_schemas_for_permitted_views
    definition = build_definition
    definition.views = [:list]
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_views, stub_context(can_read: true))
    assert_equal 1, result.size
    assert_instance_of Habarico::GlobalViewSchema, result[0]
    assert_equal 'list', result[0].name
  end

  def test_generate_views_filters_out_denied_views
    definition = build_definition
    definition.views = [:list]
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_views, stub_context(can_read: false))
    assert_equal [], result
  end

  def test_generate_views_returns_multiple_view_schemas
    definition = build_definition
    definition.views = %i[list show]
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_views, stub_context(can_read: true))
    assert_equal 2, result.size
    assert_equal 'list', result[0].name
    assert_equal 'show', result[1].name
  end

  def test_generate_schema_views_are_empty_by_default
    schema = build_generator.generate(stub_context)
    assert_equal [], schema.views
  end

  def test_generate_schema_views_include_permitted_view_schemas
    definition = build_definition
    definition.views = [:list]
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    schema = generator.generate(stub_context(can_read: true))
    assert_equal 1, schema.views.size
    assert_instance_of Habarico::GlobalViewSchema, schema.views[0]
  end

  # *****************************************************************************
  # generate_menu tests
  # *****************************************************************************

  def test_generate_menu_returns_nil_when_context_cannot_read
    definition = build_definition
    definition.menu_item = nil  # menu_item is not false, so menu would normally generate
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_menu, stub_context(can_read: false))
    assert_nil result
  end

  def test_generate_menu_returns_nil_when_menu_item_is_false
    definition = build_definition
    definition.menu_item = false
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_menu, stub_context(can_read: true))
    assert_nil result
  end

  def test_generate_menu_returns_menu_schema_when_readable_and_menu_item_set
    definition = build_definition
    definition.menu_item = Habarico::ViewMenuItem.new(view_name: 'list')
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_menu, stub_context(can_read: true))
    assert_instance_of Habarico::MenuSchema, result
  end

  def test_generate_menu_returns_menu_schema_with_default_list_view_when_menu_item_is_nil
    definition = build_definition
    definition.menu_item = nil
    generator = Habarico::GlobalResourceSchemaGenerator.new(definition, ['things'])
    result = generator.send(:generate_menu, stub_context(can_read: true))
    assert_instance_of Habarico::MenuSchema, result
  end

  def test_generate_schema_menu_is_nil_when_menu_item_is_false
    schema = build_generator.generate(stub_context)
    assert_nil schema.menu
  end

end
