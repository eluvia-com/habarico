require "test_helper"

# HAB-915 - the single reader of the `field:direction` notation. `set_pagination` in eluvia-base
# reads the `order_by` query parameter the same way, so what it lets through is exactly what
# `parse` returns.
class OrderByHelperTest < Minitest::Test

  # ***************************************************************************
  # parse
  # ***************************************************************************

  def test_parses_every_entry_of_a_list
    assert_equal [%w[name asc], %w[created_at desc]],
      Habarico::OrderByHelper.parse('name:asc,created_at:desc')
  end

  def test_parses_entries_around_whitespace
    assert_equal [%w[name asc], %w[created_at desc]],
      Habarico::OrderByHelper.parse('name:asc, created_at:desc')
  end

  def test_parses_nothing_out_of_a_blank_value
    assert_empty Habarico::OrderByHelper.parse('')
    assert_empty Habarico::OrderByHelper.parse(nil)
  end

  def test_drops_entries_set_pagination_would_have_refused
    ['name', 'name:', ':asc', 'name:asc:desc', 'name:ASC', 'name:up'].each do |value|
      assert_empty Habarico::OrderByHelper.parse(value), "expected #{value.inspect} not to parse"
    end
  end

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

end
