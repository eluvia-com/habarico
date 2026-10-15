require 'test_helper'

class FieldSchemaTest < Minitest::Test

  def test_format_accepts_time
    schema = Habarico::FieldSchema.new(name: 'start_time', type: 'string', format: 'time')
    assert_equal 'time', schema.format
  end

end
