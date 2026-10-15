require 'test_helper'

class SaveActionParametersGeneratorTest < Minitest::Test

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
    Habarico::SaveActionParametersGenerator.new(build_definition, ['things'])
  end

  def test_generates_action_save_parameters
    action = Habarico::SaveAction.new
    result = build_generator.generate(action, stub_context)
    assert_instance_of Habarico::SaveActionParameters, result
  end

  def test_data_is_nil_by_default
    action = Habarico::SaveAction.new
    result = build_generator.generate(action, stub_context)
    assert_nil result.data
  end

  def test_data_is_passed_through
    data = { 'status' => 'active' }
    action = Habarico::SaveAction.new(data: data)
    result = build_generator.generate(action, stub_context)
    assert_equal data, result.data
  end

  def test_raises_for_wrong_action_type
    action = Habarico::ResourceAction.new
    assert_raises(Eluvia::Errors::StandardError) do
      build_generator.generate(action, stub_context)
    end
  end

end
