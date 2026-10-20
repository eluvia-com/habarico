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

  def test_after_save_defaults_to_nil
    params = Habarico::SaveActionParameters.new
    assert_nil params.after_save
  end

  def test_after_save_accepts_contract_value
    params = Habarico::SaveActionParameters.new(after_save: 'show')
    assert_equal 'show', params.after_save
  end

  def test_after_save_accepts_every_contract_value
    Habarico::Types::AFTER_SAVE_TYPE.each do |value|
      assert_equal value.to_s, Habarico::SaveActionParameters.new(after_save: value).after_save
    end
  end

end
