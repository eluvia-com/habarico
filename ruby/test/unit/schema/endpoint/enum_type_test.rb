require 'test_helper'

class EnumTypeTest < Minitest::Test

  def test_icon_attribute_defaults_to_nil
    schema = Habarico::EnumType.new(value: 'active', label: 'Active')
    assert_nil schema.icon
  end

  def test_icon_attribute_accepts_string
    schema = Habarico::EnumType.new(value: 'active', label: 'Active', icon: 'CheckCircle')
    assert_equal 'CheckCircle', schema.icon
  end

end
