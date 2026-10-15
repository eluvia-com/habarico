require 'test_helper'

class ViewActionParametersTest < Minitest::Test

  # ---------------------------------------------------------------------------
  # name
  # ---------------------------------------------------------------------------

  def test_name_is_set
    params = Habarico::ViewActionParameters.new(name: 'list', mode: 'redirect')
    assert_equal 'list', params.name
  end

  # ---------------------------------------------------------------------------
  # parameters
  # ---------------------------------------------------------------------------

  def test_parameters_defaults_to_nil
    params = Habarico::ViewActionParameters.new(name: 'detail', mode: 'redirect')
    assert_nil params.parameters
  end

  def test_parameters_accepts_hash
    parameters = { 'locale' => 'cs', 'tab' => 'summary' }
    params = Habarico::ViewActionParameters.new(parameters: parameters)
    assert_equal parameters, params.parameters
  end

  # ---------------------------------------------------------------------------
  # dialog_width
  # ---------------------------------------------------------------------------

  def test_dialog_width_defaults_to_nil
    params = Habarico::ViewActionParameters.new(name: 'detail', mode: 'dialog')
    assert_nil params.dialog_width
  end

  def test_dialog_width_accepts_value
    params = Habarico::ViewActionParameters.new(name: 'detail', mode: 'dialog', dialog_width: 'md')
    assert_equal 'md', params.dialog_width
  end

  # ---------------------------------------------------------------------------
  # map
  # ---------------------------------------------------------------------------

  def test_map_sets_parameters_as_string_hash
    params = Habarico::ViewActionParameters.map(
      'name' => 'detail',
      'mode' => 'redirect',
      'parameters' => { 'locale' => 'cs', 'tab' => 'summary' }
    )
    assert_equal({ 'locale' => 'cs', 'tab' => 'summary' }, params.parameters)
  end

  def test_map_sets_dialog_width
    params = Habarico::ViewActionParameters.map(
      'name' => 'detail',
      'mode' => 'dialog',
      'dialog_width' => 'md'
    )
    assert_equal 'md', params.dialog_width
  end

  def test_map_coerces_parameter_values_to_strings
    params = Habarico::ViewActionParameters.map(
      'name' => 'detail',
      'mode' => 'redirect',
      'parameters' => { 'page' => 2 }
    )
    assert_equal({ 'page' => '2' }, params.parameters)
  end

  def test_map_with_nil_parameters_sets_empty_hash
    params = Habarico::ViewActionParameters.map('name' => 'detail', 'mode' => 'redirect')
    assert_equal({}, params.parameters)
  end

  def test_map_returns_nil_for_nil_input
    assert_nil Habarico::ViewActionParameters.map(nil)
  end

  def test_map_returns_nil_for_blank_hash
    assert_nil Habarico::ViewActionParameters.map({})
  end

  # ---------------------------------------------------------------------------
  # mode / keep_linked_parent
  # ---------------------------------------------------------------------------

  def test_mode_accepts_sidepanel
    params = Habarico::ViewActionParameters.new(name: 'detail', mode: 'sidepanel')
    assert_equal 'sidepanel', params.mode
  end

  def test_keep_linked_parent_defaults_to_nil
    params = Habarico::ViewActionParameters.new(name: 'detail', mode: 'redirect')
    assert_nil params.keep_linked_parent
  end

  def test_keep_linked_parent_accepts_true
    params = Habarico::ViewActionParameters.new(name: 'detail', keep_linked_parent: true)
    assert_equal true, params.keep_linked_parent
  end

end
