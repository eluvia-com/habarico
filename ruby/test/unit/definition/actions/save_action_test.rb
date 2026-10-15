require 'test_helper'

class SaveActionTest < Minitest::Test

  def test_type_defaults_to_save
    action = Habarico::SaveAction.new
    assert_equal :save, action.type
  end

  def test_name_defaults_to_save
    action = Habarico::SaveAction.new
    assert_equal 'save', action.name
  end

  def test_icon_defaults_to_check
    action = Habarico::SaveAction.new
    assert_equal 'Check', action.icon
  end

  def test_color_defaults_to_primary
    action = Habarico::SaveAction.new
    assert_equal :primary, action.color
  end

  def test_data_defaults_to_nil
    action = Habarico::SaveAction.new
    assert_nil action.data
  end

  def test_accepts_data
    data = { 'status' => 'active' }
    action = Habarico::SaveAction.new(data: data)
    assert_equal data, action.data
  end

end
