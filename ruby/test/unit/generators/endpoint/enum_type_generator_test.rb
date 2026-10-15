require 'test_helper'

class EnumTypeGeneratorTest < Minitest::Test

  def stub_model(icon: nil)
    model = Object.new
    choices = {
      'active' => { value: 'active', label: 'Active', color: 'success', icon: icon }
    }
    model.define_singleton_method(:has_enum_attr?) { |_attr_name| true }
    model.define_singleton_method(:find_enum_attr) { |_attr_name| choices }
    model.define_singleton_method(:model_name) { Struct.new(:i18n_key).new('stub') }
    model
  end

  def build_generator
    definition = Object.new
    definition.define_singleton_method(:enum_type_generator) { Habarico::EnumTypeGenerator }
    Habarico::EnumTypeGenerator.new(definition, ['resource'])
  end

  def test_generate_icon_returns_nil_by_default
    generator = build_generator
    schema = generator.generate(stub_model(icon: nil), :status, 'active')
    assert_nil schema.icon
  end

  def test_generate_icon_returns_value_when_set
    generator = build_generator
    schema = generator.generate(stub_model(icon: 'CheckCircle'), :status, 'active')
    assert_equal 'CheckCircle', schema.icon
  end

  def test_generate_icon_private_method_returns_nil_by_default
    generator = build_generator
    result = generator.send(:generate_icon, stub_model(icon: nil), :status, 'active')
    assert_nil result
  end

  def test_generate_icon_private_method_returns_value_when_set
    generator = build_generator
    result = generator.send(:generate_icon, stub_model(icon: 'Star'), :status, 'active')
    assert_equal 'Star', result
  end

end
