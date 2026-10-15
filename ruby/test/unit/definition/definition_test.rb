require 'test_helper'

class DefinitionTest < Minitest::Test

  # `global_fulltext_search_enabled`, the aggregation attributes and `validate_aggregate_fields!`
  # are not here on purpose: the spotlight search, aggregations and the dashboard are paid and
  # habarico-enterprise adds them (HAB-812), matching the Python split. Their behaviour is covered
  # by that gem's suite.
  def test_paid_attributes_are_not_declared_by_the_free_gem
    definition = Habarico::Definition.new

    %i[global_fulltext_search_enabled aggregate_enabled aggregate_max_buckets aggregate_fields
       dashboard_enabled aggregate_schema_generator].each do |attr|
      refute_includes Habarico::Definition.attrs, attr
      refute_respond_to definition, attr
    end
    refute_respond_to definition, :validate_aggregate_fields!
  end

  def test_search_fields_defaults_to_empty_array
    definition = Habarico::Definition.new
    assert_equal [], definition.search_fields
  end

  def test_search_fields_can_be_set
    definition = Habarico::Definition.new
    definition.search_fields = %i[title author__name]
    assert_equal %i[title author__name], definition.search_fields
  end

  def test_search_fields_is_in_attrs_list
    assert_includes Habarico::Definition.attrs, :search_fields
  end

  def test_can_read_defaults_to_true
    definition = Habarico::Definition.new
    assert_equal true, definition.can_read
  end

  def test_allow_read_by_id_defaults_to_false
    definition = Habarico::Definition.new
    assert_equal false, definition.allow_read_by_id
  end

  def test_can_create_defaults_to_false
    definition = Habarico::Definition.new
    assert_equal false, definition.can_create
  end

  def test_can_update_defaults_to_false
    definition = Habarico::Definition.new
    assert_equal false, definition.can_update
  end

  def test_can_delete_defaults_to_false
    definition = Habarico::Definition.new
    assert_equal false, definition.can_delete
  end

  Column = Struct.new(:type, :null)
end
