require "test_helper"

class SortDescriptorGeneratorTest < Minitest::Test

  def build_generator
    definition = Habarico::Definition.new
    definition.model = Object.new
    Habarico::SortDescriptorGenerator.new(definition, ['products'])
  end

  def generate(sort_descriptor)
    build_generator.generate(sort_descriptor, nil)
  end

  def test_splits_a_default_sorting_declaration
    descriptor = generate('placed_at:desc')

    assert_equal 'placed_at', descriptor.field_name
    assert_equal 'desc', descriptor.direction
  end

  def test_sorts_ascending_without_a_direction
    descriptor = generate('placed_at')

    assert_equal 'placed_at', descriptor.field_name
    assert_equal 'asc', descriptor.direction
  end

  def test_reads_the_direction_out_of_the_second_segment_only
    # The last segment used to decide, so a declaration with a stray third one described itself
    # to the frontend as descending while the backend ordered ascending (HAB-915).
    descriptor = generate('placed_at:asc:desc')

    assert_equal 'placed_at', descriptor.field_name
    assert_equal 'asc', descriptor.direction
  end

  def test_describes_nothing_without_a_declaration
    # Publishing a bare direction with no field would tell the frontend to sort by nothing; the
    # list then sorts by the primary key, which is what the backend orders by too.
    assert_nil generate(nil)
  end

end
