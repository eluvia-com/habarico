require 'test_helper'

class BoxSchemaTest < Minitest::Test

  # -------------------------------------------------------------------------
  # FieldDescriptor.intended_for_types
  # -------------------------------------------------------------------------

  def test_field_descriptor_declares_field_as_its_intended_type
    assert_includes Habarico::FieldDescriptor.intended_for_types, 'field'
  end

  def test_field_descriptor_does_not_declare_any_box_types_as_intended
    %w[simple tab tab-item wizard list object array grid grid-item].each do |type|
      refute_includes Habarico::FieldDescriptor.intended_for_types, type
    end
  end

  # -------------------------------------------------------------------------
  # BoxSchema.intended_for_types
  # -------------------------------------------------------------------------

  def test_box_schema_declares_all_box_types_as_intended
    %w[tab tab-item wizard simple list object array grid gallery].each do |type|
      assert_includes Habarico::BoxSchema.intended_for_types, type
    end
  end

  def test_box_schema_does_not_declare_field_as_intended
    refute_includes Habarico::BoxSchema.intended_for_types, 'field'
  end

  # -------------------------------------------------------------------------
  # BoxSchema.map — polymorphic boxes array
  # -------------------------------------------------------------------------

  def test_boxes_with_type_field_are_mapped_to_field_descriptor
    data = {
      'type' => 'simple',
      'boxes' => [
        { 'type' => 'field', 'name' => 'email' }
      ]
    }

    result = Habarico::BoxSchema.map(data)

    assert_equal 1, result.boxes.size
    assert_instance_of Habarico::FieldDescriptor, result.boxes[0]
  end

  def test_boxes_with_box_types_are_mapped_to_box_schema
    %w[simple tab tab-item wizard list object array grid grid-item].each do |box_type|
      data = {
        'type'  => 'simple',
        'boxes' => [{ 'type' => box_type, 'name' => 'child' }]
      }

      result = Habarico::BoxSchema.map(data)

      assert_instance_of Habarico::BoxSchema, result.boxes[0],
        "expected BoxSchema for type '#{box_type}'"
    end
  end

  def test_mixed_boxes_array_maps_to_correct_types
    data = {
      'type'  => 'simple',
      'name'  => 'root',
      'boxes' => [
        { 'type' => 'field',  'name' => 'email' },
        { 'type' => 'simple', 'name' => 'inner' },
        { 'type' => 'field',  'name' => 'name' },
        { 'type' => 'tab',    'name' => 'tabs' }
      ]
    }

    result = Habarico::BoxSchema.map(data)

    assert_equal 4, result.boxes.size
    assert_instance_of Habarico::FieldDescriptor, result.boxes[0]
    assert_instance_of Habarico::BoxSchema,       result.boxes[1]
    assert_instance_of Habarico::FieldDescriptor, result.boxes[2]
    assert_instance_of Habarico::BoxSchema,       result.boxes[3]
  end

  def test_attribute_values_are_preserved_for_field_descriptor_items
    data = {
      'type'  => 'simple',
      'boxes' => [{ 'type' => 'field', 'name' => 'email', 'label' => 'Email address' }]
    }

    result = Habarico::BoxSchema.map(data)
    field = result.boxes[0]

    assert_equal 'email',         field.name
    assert_equal 'Email address', field.label
  end

  def test_attribute_values_are_preserved_for_box_schema_items
    data = {
      'type'  => 'simple',
      'boxes' => [{ 'type' => 'tab', 'name' => 'main_tab', 'label' => 'Main' }]
    }

    result = Habarico::BoxSchema.map(data)
    box = result.boxes[0]

    assert_equal 'main_tab', box.name
    assert_equal 'Main',     box.label
  end

  def test_empty_boxes_array_maps_to_empty_array
    data = { 'type' => 'simple', 'boxes' => [] }
    result = Habarico::BoxSchema.map(data)
    assert_equal [], result.boxes
  end

  def test_nil_boxes_maps_to_empty_array
    data = { 'type' => 'simple' }
    result = Habarico::BoxSchema.map(data)
    assert_equal [], result.boxes
  end

  # -------------------------------------------------------------------------
  # Recursive nesting
  # -------------------------------------------------------------------------

  def test_nested_box_schema_with_field_descriptor_children_maps_recursively
    data = {
      'type'  => 'tab',
      'boxes' => [
        {
          'type'  => 'tab-item',
          'name'  => 'info',
          'boxes' => [
            { 'type' => 'field', 'name' => 'email' },
            { 'type' => 'field', 'name' => 'name' }
          ]
        }
      ]
    }

    result = Habarico::BoxSchema.map(data)

    tab_item = result.boxes[0]
    assert_instance_of Habarico::BoxSchema, tab_item
    assert_equal 2, tab_item.boxes.size
    assert_instance_of Habarico::FieldDescriptor, tab_item.boxes[0]
    assert_instance_of Habarico::FieldDescriptor, tab_item.boxes[1]
    assert_equal 'email', tab_item.boxes[0].name
    assert_equal 'name',  tab_item.boxes[1].name
  end

  # -------------------------------------------------------------------------
  # BoxSchema.map — top-level attributes
  # -------------------------------------------------------------------------

  def test_map_assigns_top_level_box_schema_attributes
    data = {
      'type'      => 'simple',
      'name'      => 'main',
      'label'     => 'Main Box',
      'read_only' => true,
      'card'      => false
    }

    result = Habarico::BoxSchema.map(data)

    assert_equal 'simple',   result.type
    assert_equal 'main',     result.name
    assert_equal 'Main Box', result.label
    assert_equal true,       result.read_only
  end

  def test_map_returns_nil_for_nil_input
    assert_nil Habarico::BoxSchema.map(nil)
  end

  def test_map_returns_nil_for_non_hash_input
    assert_nil Habarico::BoxSchema.map('not a hash')
  end

end
