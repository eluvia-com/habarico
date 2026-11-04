require "test_helper"

class ReflectionHelperTest < Minitest::Test

  def test_primary_key_fields_cover_a_composite_key
    model = Class.new
    model.define_singleton_method(:primary_key) { %w[tenant_id id] }

    assert_equal %w[tenant_id id], Habarico::ReflectionHelper.primary_key_fields(model)
  end

  def test_a_model_without_a_primary_key_has_no_primary_key_fields
    assert_equal [], Habarico::ReflectionHelper.primary_key_fields(Class.new)
  end

  def gallery_model
    model = Class.new
    model.define_singleton_method(:has_file_array_attr?) { |field| %i[gallery documents].include?(field.to_sym) }
    model.define_singleton_method(:find_file_array_attr) { |field| { attr_name: field.to_sym, append_only: field.to_sym == :gallery } }
    model
  end

  def test_an_append_only_file_array_attr_is_recognised
    assert Habarico::ReflectionHelper.is_append_only_file_array_attr?(gallery_model, :gallery)
  end

  def test_a_default_file_array_attr_is_not_append_only
    refute Habarico::ReflectionHelper.is_append_only_file_array_attr?(gallery_model, :documents)
  end

  def test_a_model_without_file_array_attrs_has_no_append_only_one
    refute Habarico::ReflectionHelper.is_append_only_file_array_attr?(Class.new, :gallery)
  end

end
