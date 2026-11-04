require 'test_helper'

class UploadFilesActionParametersGeneratorTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model
  end

  def stub_context
    ctx = Object.new
    ctx.define_singleton_method(:can?) { |_permission| true }
    ctx
  end

  def build_definition
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.label = 'Things'
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    definition
  end

  def build_generator
    Habarico::UploadFilesActionParametersGenerator.new(build_definition, ['things'])
  end

  def test_definition_uses_generator_by_default
    assert_equal Habarico::UploadFilesActionParametersGenerator,
                 build_definition.upload_files_action_parameters_generator
  end

  def test_generates_upload_files_parameters
    action = Habarico::UploadFilesAction.new
    result = build_generator.generate(action, stub_context)
    assert_instance_of Habarico::UploadFilesActionParameters, result
  end

  def test_passes_upload_files_attributes_through
    action = Habarico::UploadFilesAction.new(
      upload_files_reference: 'attachments',
      upload_files_target: 'order',
      upload_files_accept: ['.pdf', '.docx'],
      upload_files_file_field: 'file'
    )
    result = build_generator.generate(action, stub_context)
    assert_equal 'attachments', result.reference.resource
    assert_equal 'order', result.target
    assert_equal ['.pdf', '.docx'], result.accept
    assert_equal 'file', result.file_field
  end

  def test_data_is_nil_by_default
    assert_nil build_generator.generate(Habarico::UploadFilesAction.new, stub_context).data
  end

  def test_data_is_passed_through
    action = Habarico::UploadFilesAction.new(upload_files_data: { 'source' => 'catalogue' })
    result = build_generator.generate(action, stub_context)
    assert_equal({ 'source' => 'catalogue' }, result.data)
  end

  def test_data_is_resolved_from_a_callable
    action = Habarico::UploadFilesAction.new(upload_files_data: ->(_context) { { 'source' => 'catalogue' } })
    result = build_generator.generate(action, stub_context)
    assert_equal({ 'source' => 'catalogue' }, result.data)
  end

  def test_raises_for_wrong_action_type
    action = Habarico::SaveAction.new
    assert_raises(Eluvia::Errors::StandardError) do
      build_generator.generate(action, stub_context)
    end
  end

end
