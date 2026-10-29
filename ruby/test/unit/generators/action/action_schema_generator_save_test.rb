require 'test_helper'

class ActionSchemaGeneratorSaveTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model
  end

  def stub_context
    ctx = Object.new
    ctx.define_singleton_method(:can?) { |_permission| true }
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
    Habarico::ActionSchemaGenerator.new(build_definition, ['things'])
  end

  def test_generate_save_returns_nil_when_no_data
    action = Habarico::SaveAction.new
    result = build_generator.send(:generate_save, action, stub_context)
    assert_nil result
  end

  def test_generate_save_returns_parameters_when_data_present
    action = Habarico::SaveAction.new(data: { 'status' => 'active' })
    result = build_generator.send(:generate_save, action, stub_context)
    assert_instance_of Habarico::SaveActionParameters, result
    assert_equal({ 'status' => 'active' }, result.data)
  end

  def test_generate_save_returns_parameters_when_only_after_save_present
    action = Habarico::SaveAction.new(after_save: :list)
    result = build_generator.send(:generate_save, action, stub_context)
    assert_instance_of Habarico::SaveActionParameters, result
    assert_nil result.data
    assert_equal 'list', result.after_save
  end

  def test_generate_produces_schema_with_save_type
    action = Habarico::SaveAction.new
    schema = build_generator.generate(action, stub_context)
    assert_equal 'save', schema.type
  end

  def test_generate_produces_schema_with_save_nil_when_no_data
    action = Habarico::SaveAction.new
    schema = build_generator.generate(action, stub_context)
    assert_nil schema.save
  end

  def test_generate_produces_schema_with_save_parameters_when_data_present
    action = Habarico::SaveAction.new(data: { 'status' => 'active' })
    schema = build_generator.generate(action, stub_context)
    assert_instance_of Habarico::SaveActionParameters, schema.save
    assert_equal({ 'status' => 'active' }, schema.save.data)
  end

end
