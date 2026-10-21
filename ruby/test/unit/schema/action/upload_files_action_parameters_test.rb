require 'test_helper'

class UploadFilesActionParametersTest < Minitest::Test

  def test_attributes_default_to_nil
    params = Habarico::UploadFilesActionParameters.new
    assert_nil params.reference
    assert_nil params.target
    assert_nil params.accept
    assert_nil params.file_field
  end

  def test_serializes_contract_keys
    params = Habarico::UploadFilesActionParameters.new(
      reference: 'attachments', target: 'order', accept: ['.pdf'], file_field: 'file'
    )
    assert_equal(
      { 'reference' => 'attachments', 'target' => 'order', 'accept' => ['.pdf'], 'file_field' => 'file' },
      params.as_json
    )
  end

end
