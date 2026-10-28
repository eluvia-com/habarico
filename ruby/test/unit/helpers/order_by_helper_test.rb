require "test_helper"

# The `field:direction` notation of `default_sorting` declarations and of `fallback_order_by`.
class OrderByHelperTest < Minitest::Test

  # ***************************************************************************
  # field_name / direction - a `default_sorting` declaration, written by hand
  # ***************************************************************************

  def test_reads_the_field_name_of_an_entry
    assert_equal 'created_at', Habarico::OrderByHelper.field_name('created_at:desc')
    assert_equal 'created_at', Habarico::OrderByHelper.field_name('created_at')
    assert_nil Habarico::OrderByHelper.field_name(nil)
  end

  def test_reads_the_direction_of_an_entry
    assert_equal 'desc', Habarico::OrderByHelper.direction('created_at:desc')
    assert_equal 'asc', Habarico::OrderByHelper.direction('created_at:asc')
  end

  def test_falls_back_to_ascending
    assert_equal 'asc', Habarico::OrderByHelper.direction('created_at')
    assert_equal 'asc', Habarico::OrderByHelper.direction(nil)
  end

  def test_reads_the_direction_out_of_the_second_segment_only
    # A third segment used to decide the direction, so `created_at:asc:desc` sorted descending
    # while it advertised itself as ascending.
    assert_equal 'asc', Habarico::OrderByHelper.direction('created_at:asc:desc')
  end

  # ***************************************************************************
  # build
  # ***************************************************************************

  def test_builds_every_field_in_the_direction
    assert_equal 'tenant_id:asc,id:asc', Habarico::OrderByHelper.build(%w[tenant_id id], :asc)
  end

  def test_builds_nothing_out_of_no_fields
    assert_equal '', Habarico::OrderByHelper.build([], :asc)
  end

end
