require 'test_helper'

class ActionDescriptorTest < Minitest::Test

  def test_has_view_attribute
    descriptor = Habarico::ActionDescriptor.new(name: 'my_action')
    assert_nil descriptor.view
  end

  def test_view_accepts_action_descriptor_menu_view_parameters
    view_params = Habarico::ViewActionDescriptorParameters.new(mode: 'redirect')
    descriptor = Habarico::ActionDescriptor.new(name: 'my_action', view: view_params)
    assert_equal view_params, descriptor.view
  end

  def test_has_menu_items_attribute
    descriptor = Habarico::ActionDescriptor.new(name: 'my_action')
    assert_nil descriptor.menu_items
  end

  def test_menu_items_accepts_list_of_action_descriptors
    item1 = Habarico::ActionDescriptor.new(name: 'item_1')
    item2 = Habarico::ActionDescriptor.new(name: 'item_2')
    descriptor = Habarico::ActionDescriptor.new(name: 'my_action', menu_items: [item1, item2])
    assert_equal 2, descriptor.menu_items.length
    assert_equal 'item_1', descriptor.menu_items[0].name
    assert_equal 'item_2', descriptor.menu_items[1].name
  end

  def test_existing_attributes_still_work
    descriptor = Habarico::ActionDescriptor.new(
      name: 'edit',
      label: 'Edit',
      icon: 'Edit',
      color: 'primary'
    )
    assert_equal 'edit', descriptor.name
    assert_equal 'Edit', descriptor.label
    assert_equal 'Edit', descriptor.icon
    assert_equal 'primary', descriptor.color
  end

  def test_action_descriptor_menu_view_parameters_mode
    view_params = Habarico::ViewActionDescriptorParameters.new(mode: 'dialog')
    assert_equal 'dialog', view_params.mode
  end

  def test_action_descriptor_menu_view_parameters_mode_accepts_sidepanel
    view_params = Habarico::ViewActionDescriptorParameters.new(mode: 'sidepanel')
    assert_equal 'sidepanel', view_params.mode
  end

  def test_action_descriptor_menu_view_parameters_keep_linked_parent_defaults_to_nil
    view_params = Habarico::ViewActionDescriptorParameters.new(mode: 'redirect')
    assert_nil view_params.keep_linked_parent
  end

  def test_action_descriptor_menu_view_parameters_keep_linked_parent_accepts_true
    view_params = Habarico::ViewActionDescriptorParameters.new(keep_linked_parent: true)
    assert_equal true, view_params.keep_linked_parent
  end

  def test_action_descriptor_menu_view_parameters_choices
    choices = [{ name: 'view_a' }, { name: 'view_b' }]
    view_params = Habarico::ViewActionDescriptorParameters.new(choices: choices)
    assert_equal choices, view_params.choices
  end

  def test_action_descriptor_menu_view_parameters_choices_accepts_menu_view_choice_objects
    choice = Habarico::ActionViewChoice.new(label: 'Option A', parameters: { 'locale' => 'cs' })
    view_params = Habarico::ViewActionDescriptorParameters.new(choices: [choice])
    assert_equal 1, view_params.choices.length
    assert_instance_of Habarico::ActionViewChoice, view_params.choices[0]
    assert_equal 'Option A', view_params.choices[0].label
  end

  def test_action_descriptor_menu_view_parameters_choices_defaults_to_nil
    view_params = Habarico::ViewActionDescriptorParameters.new
    assert_nil view_params.choices
  end

  def test_action_descriptor_menu_view_parameters_map_choices
    view_params = Habarico::ViewActionDescriptorParameters.map(
      'mode' => 'redirect',
      'choices' => [
        { 'label' => 'Option A', 'parameters' => { 'locale' => 'cs' } },
        { 'label' => 'Option B', 'parameters' => { 'locale' => 'en' } }
      ]
    )
    assert_equal 2, view_params.choices.length
    assert_instance_of Habarico::ActionViewChoice, view_params.choices[0]
    assert_equal 'Option A', view_params.choices[0].label
    assert_equal({ 'locale' => 'cs' }, view_params.choices[0].parameters)
    assert_equal 'Option B', view_params.choices[1].label
  end

  def test_action_descriptor_menu_view_parameters_parameters
    params = { locale: 'cs' }
    view_params = Habarico::ViewActionDescriptorParameters.new(parameters: params)
    assert_equal params, view_params.parameters
  end

  def test_action_descriptor_menu_view_parameters_parameters_defaults_to_nil
    view_params = Habarico::ViewActionDescriptorParameters.new
    assert_nil view_params.parameters
  end

  def test_action_descriptor_menu_view_parameters_map_parameters
    view_params = Habarico::ViewActionDescriptorParameters.map(
      'mode' => 'dialog',
      'parameters' => { 'locale' => 'cs', 'tab' => 'summary' }
    )
    assert_equal({ 'locale' => 'cs', 'tab' => 'summary' }, view_params.parameters)
  end

  def test_action_descriptor_menu_view_parameters_map_coerces_parameter_values_to_strings
    view_params = Habarico::ViewActionDescriptorParameters.map(
      'mode' => 'dialog',
      'parameters' => { 'page' => 2 }
    )
    assert_equal({ 'page' => '2' }, view_params.parameters)
  end

end
