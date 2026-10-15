require 'test_helper'

class FieldDescriptorTest < Minitest::Test

  def test_has_action_attribute
    descriptor = Habarico::FieldDescriptor.new(name: 'title', type: 'field')
    assert_nil descriptor.action
  end

  def test_action_accepts_action_descriptor
    action = Habarico::ActionDescriptor.new(name: 'show')
    descriptor = Habarico::FieldDescriptor.new(name: 'title', type: 'field', action: action)
    assert_equal action, descriptor.action
    assert_equal 'show', descriptor.action.name
  end

  def test_has_wrapper_attribute
    descriptor = Habarico::FieldDescriptor.new(name: 'title', type: 'field')
    assert_nil descriptor.wrapper
  end

  def test_wrapper_accepts_field_wrapper_properties
    inner = Habarico::FieldDescriptor.new(name: 'first_name', type: 'field')
    wrapper = Habarico::FieldWrapperProperties.new(fields: [inner])
    descriptor = Habarico::FieldDescriptor.new(name: 'name', type: 'field', wrapper: wrapper)
    assert_equal wrapper, descriptor.wrapper
    assert_equal 1, descriptor.wrapper.fields.length
    assert_equal 'first_name', descriptor.wrapper.fields[0].name
  end

  def test_existing_attributes_still_work
    descriptor = Habarico::FieldDescriptor.new(
      name: 'title',
      type: 'field',
      label: 'Title',
      sortable: true,
      read_only: false
    )
    assert_equal 'title', descriptor.name
    assert_equal 'Title', descriptor.label
    assert_equal true, descriptor.sortable
    assert_equal false, descriptor.read_only
  end

  def test_field_wrapper_properties_has_divider
    wrapper = Habarico::FieldWrapperProperties.new(divider: ' - ')
    assert_equal ' - ', wrapper.divider
  end

  def test_field_wrapper_properties_fields_default_nil
    wrapper = Habarico::FieldWrapperProperties.new
    assert_nil wrapper.fields
  end

end
