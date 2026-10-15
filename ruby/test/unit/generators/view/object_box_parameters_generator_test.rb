require 'test_helper'

class ObjectBoxParametersGeneratorTest < Minitest::Test

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

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
    Habarico::ObjectBoxParametersGenerator.new(build_definition, ['things'])
  end

  def build_box(target: 'address')
    Habarico::ObjectBox.new(target: target)
  end

  # ---------------------------------------------------------------------------
  # ObjectBox definition
  # ---------------------------------------------------------------------------

  def test_object_box_type_is_object
    box = Habarico::ObjectBox.new
    assert_equal 'object', box.type
  end

  def test_object_box_accepts_target
    box = Habarico::ObjectBox.new(target: 'address')
    assert_equal 'address', box.target
  end

  # ---------------------------------------------------------------------------
  # Generator — private method generate_target
  # ---------------------------------------------------------------------------

  def test_generate_target_returns_box_target
    generator = build_generator
    box = build_box(target: 'nested_contact')
    assert_equal 'nested_contact', generator.send(:generate_target, box, stub_context)
  end

  def test_generate_raises_for_non_object_box
    generator = build_generator
    array_box = Habarico::ArrayBox.new(target: 'items')
    assert_raises(Eluvia::Errors::StandardError) do
      generator.generate(array_box, stub_context)
    end
  end

  def test_generate_raises_when_target_is_missing
    generator = build_generator
    box = Habarico::ObjectBox.new
    assert_raises(Eluvia::Errors::StandardError) do
      generator.generate(box, stub_context)
    end
  end

  # ---------------------------------------------------------------------------
  # Generator — full generate output
  # ---------------------------------------------------------------------------

  def test_generate_returns_object_box_parameters
    generator = build_generator
    result = generator.generate(build_box(target: 'address'), stub_context)
    assert_instance_of Habarico::ObjectBoxParameters, result
  end

  def test_generate_sets_target
    generator = build_generator
    result = generator.generate(build_box(target: 'address'), stub_context)
    assert_equal 'address', result.target
  end

  def test_generate_sets_target_for_different_values
    generator = build_generator
    result = generator.generate(build_box(target: 'nested_profile'), stub_context)
    assert_equal 'nested_profile', result.target
  end

end
