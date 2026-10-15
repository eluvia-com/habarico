require 'test_helper'

class GlobalViewSchemaGeneratorTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model
  end

  def build_generator
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.label = 'Things'
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    Habarico::GlobalViewSchemaGenerator.new(definition, ['things'])
  end

  # ---------------------------------------------------------------------------
  # generate_mode tests
  # ---------------------------------------------------------------------------

  def test_generate_mode_returns_nil_by_default
    generator = build_generator
    assert_nil generator.send(:generate_mode, Habarico::ListView.new)
  end

  def test_generate_mode_returns_value_when_set
    generator = build_generator
    view = Habarico::ShowView.new
    view.view_mode = 'sidepanel'
    assert_equal 'sidepanel', generator.send(:generate_mode, view)
  end

end
