require 'test_helper'

class ObjectBoxParametersTest < Minitest::Test

  def test_target_attribute_is_set
    params = Habarico::ObjectBoxParameters.new(target: 'address')
    assert_equal 'address', params.target
  end

  def test_target_defaults_to_nil
    params = Habarico::ObjectBoxParameters.new
    assert_nil params.target
  end

  def test_target_accepts_any_string
    params = Habarico::ObjectBoxParameters.new(target: 'nested_profile')
    assert_equal 'nested_profile', params.target
  end

end
