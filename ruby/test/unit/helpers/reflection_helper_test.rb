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

end
