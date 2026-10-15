require 'test_helper'

class SaveActionParametersTest < Minitest::Test

  def test_data_defaults_to_nil
    params = Habarico::SaveActionParameters.new
    assert_nil params.data
  end

  def test_data_accepts_hash
    data = { 'status' => 'active' }
    params = Habarico::SaveActionParameters.new(data: data)
    assert_equal data, params.data
  end

end
