require 'test_helper'

class LocalResourceSchemaGeneratorTest < Minitest::Test

  class RecordingEndpointsGenerator
    attr_reader :methods

    def generate(_model, _read_fields, _write_fields, _filters, methods)
      @methods = methods
    end
  end

  def build_generator(endpoints_generator)
    definition = Habarico::Definition.new
    definition.fields = []
    definition.read_only_fields = []
    definition.write_only_fields = []
    definition.filters = []
    generator = Habarico::LocalResourceSchemaGenerator.new(definition, ['products'])
    generator.define_singleton_method(:endpoints_schema_generator) { endpoints_generator }
    generator
  end

  def endpoint(method, reference = nil)
    Habarico::ViewEndpointParameters.new(method: method, reference: reference)
  end

  def test_endpoints_take_the_methods_of_views_on_the_resource_itself_and_always_get
    recorder = RecordingEndpointsGenerator.new
    build_generator(recorder).send(:generate_endpoints, nil, [endpoint('post'), endpoint('put')])

    assert_equal %i[post put get], recorder.methods
  end

  def test_endpoints_skip_views_that_address_another_resource_or_an_action
    recorder = RecordingEndpointsGenerator.new
    endpoints = [
      endpoint('post', Habarico::ResourceReference.build('categories')),
      endpoint('patch', Habarico::ResourceReference.build('products', action_name: 'publish'))
    ]
    build_generator(recorder).send(:generate_endpoints, nil, endpoints)

    assert_equal %i[get], recorder.methods
  end

end
