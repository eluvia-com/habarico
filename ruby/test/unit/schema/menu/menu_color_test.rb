require 'test_helper'

class MenuColorTest < Minitest::Test

  # ---------------------------------------------------------------------------
  # MenuSchema / MenuGroupSchema both carry the colour, as the contract has them
  # ---------------------------------------------------------------------------

  def test_menu_schema_accepts_color
    schema = Habarico::MenuSchema.new(name: 'articles', label: 'Articles', type: 'view', color: 'primary')
    assert_equal 'primary', schema.color
  end

  def test_menu_schema_defaults_color_to_nil
    schema = Habarico::MenuSchema.new(name: 'articles', label: 'Articles', type: 'view')
    assert_nil schema.color
  end

  def test_menu_group_schema_accepts_color
    schema = Habarico::MenuGroupSchema.new(name: 'content', label: 'Content', color: 'secondary')
    assert_equal 'secondary', schema.color
  end

  def test_color_is_emitted
    schema = Habarico::MenuSchema.new(name: 'articles', label: 'Articles', type: 'view', color: 'primary')
    assert_includes schema.as_json.keys, 'color'
  end

  def test_color_choices_are_shared_with_the_other_color_attributes
    expected = Habarico::ActionSchema.find_enum_attr(:color).keys
    assert_equal expected, Habarico::MenuSchema.find_enum_attr(:color).keys
    assert_equal expected, Habarico::MenuGroupSchema.find_enum_attr(:color).keys
  end

end
