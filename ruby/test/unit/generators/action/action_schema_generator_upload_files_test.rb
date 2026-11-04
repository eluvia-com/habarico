require 'test_helper'

class ActionSchemaGeneratorUploadFilesTest < Minitest::Test

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

  def build_generator(definition = build_definition)
    Habarico::ActionSchemaGenerator.new(definition, ['things'])
  end

  def build_action
    Habarico::UploadFilesAction.new(
      upload_files_reference: 'attachments',
      upload_files_target: 'order',
      upload_files_accept: ['.pdf'],
      upload_files_file_field: 'file',
      upload_files_data: { 'source' => 'catalogue' }
    )
  end

  def test_generate_produces_schema_with_upload_files_type
    schema = build_generator.generate(build_action, stub_context)
    assert_equal 'upload-files', schema.type
  end

  def test_generate_produces_schema_with_upload_files_parameters
    schema = build_generator.generate(build_action, stub_context)
    assert_instance_of Habarico::UploadFilesActionParameters, schema.upload_files
    assert_equal 'file', schema.upload_files.file_field
  end

  def test_generate_serializes_parameters_under_upload_files_key
    json = Habarico::Serializers.compact_json(build_generator.generate(build_action, stub_context).as_json)
    assert_equal 'upload-files', json['type']
    assert_equal(
      { 'reference' => { 'resource' => 'attachments' }, 'target' => 'order', 'accept' => ['.pdf'], 'file_field' => 'file',
        'data' => { 'source' => 'catalogue' } },
      json['upload_files']
    )
  end

  def test_generate_leaves_upload_files_nil_for_other_types
    schema = build_generator.generate(Habarico::SaveAction.new, stub_context)
    assert_nil schema.upload_files
  end

  def test_generate_uses_generator_configured_on_definition
    custom_generator = Class.new(Habarico::UploadFilesActionParametersGenerator) do
      def generate_file_field(_action, _context)
        'document'
      end
    end
    definition = build_definition
    definition.upload_files_action_parameters_generator = custom_generator
    schema = build_generator(definition).generate(build_action, stub_context)
    assert_equal 'document', schema.upload_files.file_field
  end

end
