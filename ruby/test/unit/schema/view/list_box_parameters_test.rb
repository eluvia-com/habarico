require 'test_helper'

class ListBoxParametersTest < Minitest::Test

  def test_has_sortable_attribute
    params = Habarico::ListBoxParameters.new(reference: 'items', target: 'parent_id')
    assert_nil params.sortable
  end

  def test_sortable_accepts_list_box_sortable_parameters
    sortable = Habarico::SortableParameters.new(field_name: 'position', sort_for_filters: { category_id: 1 })
    params = Habarico::ListBoxParameters.new(reference: 'items', target: 'parent_id', sortable: sortable)
    assert_instance_of Habarico::SortableParameters, params.sortable
    assert_equal 'position', params.sortable.field_name
    assert_equal({ category_id: 1 }, params.sortable.sort_for_filters)
  end

  def test_has_schema_params_attribute
    params = Habarico::ListBoxParameters.new(reference: 'items', target: 'parent_id')
    assert_nil params.schema_params
  end

  def test_schema_params_accepts_hash
    schema_params = { view: 'compact' }
    params = Habarico::ListBoxParameters.new(reference: 'items', target: 'parent_id', schema_params: schema_params)
    assert_equal schema_params, params.schema_params
  end

  def test_map_sets_schema_params_as_string_hash
    params = Habarico::ListBoxParameters.map(
      'reference' => 'items',
      'schema_params' => { 'view' => 'compact', 'locale' => 'cs' }
    )
    assert_equal({ 'view' => 'compact', 'locale' => 'cs' }, params.schema_params)
  end

  def test_map_coerces_schema_params_values_to_strings
    params = Habarico::ListBoxParameters.map(
      'reference' => 'items',
      'schema_params' => { 'page' => 2 }
    )
    assert_equal({ 'page' => '2' }, params.schema_params)
  end

  def test_map_with_nil_schema_params_sets_empty_hash
    params = Habarico::ListBoxParameters.map('reference' => 'items')
    assert_equal({}, params.schema_params)
  end

  def test_single_click_action_defaults_to_nil
    params = Habarico::ListBoxParameters.new(reference: 'items', target: 'parent_id')
    assert_nil params.single_click_action
  end

  def test_double_click_action_defaults_to_nil
    params = Habarico::ListBoxParameters.new(reference: 'items', target: 'parent_id')
    assert_nil params.double_click_action
  end

  def test_single_click_action_accepts_action_descriptor
    action = Habarico::ActionDescriptor.new(name: 'show')
    params = Habarico::ListBoxParameters.new(reference: 'items', target: 'parent_id', single_click_action: action)
    assert_instance_of Habarico::ActionDescriptor, params.single_click_action
    assert_equal 'show', params.single_click_action.name
  end

  def test_double_click_action_accepts_action_descriptor
    action = Habarico::ActionDescriptor.new(name: 'edit')
    params = Habarico::ListBoxParameters.new(reference: 'items', target: 'parent_id', double_click_action: action)
    assert_instance_of Habarico::ActionDescriptor, params.double_click_action
    assert_equal 'edit', params.double_click_action.name
  end

  def test_existing_attributes_still_work
    params = Habarico::ListBoxParameters.new(
      reference: 'items',
      target: 'parent_id',
      extra_filters: { status: 'active' }
    )
    assert_equal 'items', params.reference
    assert_equal 'parent_id', params.target
    assert_equal({ status: 'active' }, params.extra_filters)
  end

end
