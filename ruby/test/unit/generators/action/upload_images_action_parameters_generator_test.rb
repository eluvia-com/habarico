require 'test_helper'

class UploadImagesActionParametersGeneratorTest < Minitest::Test

  def stub_context
    ctx = Object.new
    ctx.define_singleton_method(:can?) { |_permission| true }
    ctx
  end

  def build_definition
    definition = Habarico::Definition.new
    definition.model = Object.new
    definition.label = 'Products'
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    definition
  end

  def build_generator
    Habarico::UploadImagesActionParametersGenerator.new(build_definition, ['products'])
  end

  def build_action(params = {})
    Habarico::UploadImagesAction.new({ name: 'upload_photos', upload_images_image_field: 'photo' }.merge(params))
  end

  def test_data_is_nil_by_default
    assert_nil build_generator.generate(build_action, stub_context).data
  end

  def test_data_is_passed_through
    result = build_generator.generate(build_action(upload_images_data: { 'source' => 'catalogue' }), stub_context)
    assert_equal({ 'source' => 'catalogue' }, result.data)
  end

  def test_data_is_resolved_from_a_callable
    result = build_generator.generate(build_action(upload_images_data: ->(_context) { { 'source' => 'catalogue' } }), stub_context)
    assert_equal({ 'source' => 'catalogue' }, result.data)
  end

  def test_raises_for_wrong_action_type
    assert_raises(Eluvia::Errors::StandardError) do
      build_generator.generate(Habarico::ResourceAction.new, stub_context)
    end
  end

end
