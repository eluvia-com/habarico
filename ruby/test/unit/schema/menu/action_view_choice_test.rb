require 'test_helper'

class ActionViewChoiceTest < Minitest::Test

  # ---------------------------------------------------------------------------
  # label
  # ---------------------------------------------------------------------------

  def test_label_is_set
    choice = Habarico::ActionViewChoice.new(label: 'Option A')
    assert_equal 'Option A', choice.label
  end

  def test_label_defaults_to_nil
    choice = Habarico::ActionViewChoice.new
    assert_nil choice.label
  end

  # ---------------------------------------------------------------------------
  # parameters
  # ---------------------------------------------------------------------------

  def test_parameters_is_set
    choice = Habarico::ActionViewChoice.new(parameters: { 'locale' => 'cs' })
    assert_equal({ 'locale' => 'cs' }, choice.parameters)
  end

  def test_parameters_defaults_to_nil
    choice = Habarico::ActionViewChoice.new
    assert_nil choice.parameters
  end

  # ---------------------------------------------------------------------------
  # map
  # ---------------------------------------------------------------------------

  def test_map_sets_label
    choice = Habarico::ActionViewChoice.map('label' => 'Option B', 'parameters' => {})
    assert_equal 'Option B', choice.label
  end

  def test_map_sets_parameters_as_string_hash
    choice = Habarico::ActionViewChoice.map('label' => 'Option A', 'parameters' => { 'locale' => 'cs', 'tab' => 'summary' })
    assert_equal({ 'locale' => 'cs', 'tab' => 'summary' }, choice.parameters)
  end

  def test_map_coerces_parameter_values_to_strings
    choice = Habarico::ActionViewChoice.map('label' => 'Option A', 'parameters' => { 'count' => 5 })
    assert_equal({ 'count' => '5' }, choice.parameters)
  end

  def test_map_returns_nil_for_nil_input
    assert_nil Habarico::ActionViewChoice.map(nil)
  end

  def test_map_returns_nil_for_blank_hash
    assert_nil Habarico::ActionViewChoice.map({})
  end

end
