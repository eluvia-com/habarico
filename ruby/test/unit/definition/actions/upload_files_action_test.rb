require 'test_helper'

class UploadFilesActionTest < Minitest::Test

  def test_type_defaults_to_upload_files
    action = Habarico::UploadFilesAction.new
    assert_equal :"upload-files", action.type
  end

  def test_accepts_upload_files_attributes
    action = Habarico::UploadFilesAction.new(
      upload_files_reference: 'attachments',
      upload_files_target: 'order',
      upload_files_accept: ['.pdf', '.docx'],
      upload_files_file_field: 'file'
    )
    assert_equal 'attachments', action.upload_files_reference
    assert_equal 'order', action.upload_files_target
    assert_equal ['.pdf', '.docx'], action.upload_files_accept
    assert_equal 'file', action.upload_files_file_field
  end

end
