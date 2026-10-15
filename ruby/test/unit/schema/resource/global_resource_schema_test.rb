require 'test_helper'

class GlobalResourceSchemaTest < Minitest::Test

  # `global_fulltext_search_enabled` is deliberately absent: the spotlight search is paid and
  # habarico-enterprise adds the attribute to this schema (HAB-812). The key is optional in
  # `doc/openapi.yaml`, so a free-only install simply omits it.
  def test_global_fulltext_search_enabled_is_not_a_free_attribute
    schema = Habarico::GlobalResourceSchema.new(name: 'things', label: 'Things', pk_field_name: 'id')

    refute_respond_to schema, :global_fulltext_search_enabled
  end

  # `aggregate_enabled` / `dashboard_enabled` are deliberately absent too: aggregations and the
  # dashboard are paid and habarico-enterprise adds both keys (HAB-812), matching Python.
  def test_paid_keys_are_not_free_attributes
    schema = Habarico::GlobalResourceSchema.new(name: 'things', label: 'Things', pk_field_name: 'id')

    refute_respond_to schema, :aggregate_enabled
    refute_respond_to schema, :dashboard_enabled
  end

  def test_inherits_name_from_resource_schema
    schema = Habarico::GlobalResourceSchema.new(
      name: 'articles',
      label: 'Articles',
      pk_field_name: 'id',
      actions: [],
      views: [],
    )
    assert_equal 'articles', schema.name
  end

  def test_inherits_label_from_resource_schema
    schema = Habarico::GlobalResourceSchema.new(
      name: 'articles',
      label: 'Articles',
      pk_field_name: 'id',
      actions: [],
      views: [],
    )
    assert_equal 'Articles', schema.label
  end

  def test_inherits_pk_field_name_from_resource_schema
    schema = Habarico::GlobalResourceSchema.new(
      name: 'articles',
      label: 'Articles',
      pk_field_name: 'uuid',
      actions: [],
      views: [],
    )
    assert_equal 'uuid', schema.pk_field_name
  end

  def test_menu_accepts_menu_schema_instance
    menu = Habarico::MenuSchema.new(
      name: 'articles-list',
      label: 'Articles',
      priority: 100,
      type: :view,
    )
    schema = Habarico::GlobalResourceSchema.new(
      name: 'articles',
      label: 'Articles',
      pk_field_name: 'id',
      actions: [],
      views: [],
      menu: menu,
    )
    assert_instance_of Habarico::MenuSchema, schema.menu
  end

  def test_menu_accepts_nil
    schema = Habarico::GlobalResourceSchema.new(
      name: 'articles',
      label: 'Articles',
      pk_field_name: 'id',
      actions: [],
      views: [],
      menu: nil,
    )
    assert_nil schema.menu
  end

end
