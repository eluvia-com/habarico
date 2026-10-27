require "test_helper"
require "minitest/mock"

%w[application_controller local_schema_controller action_schema_controller global_schema_controller].each do |name|
  require_relative "../../../app/controllers/habarico/#{name}"
end

module Habarico
  # The schema endpoints of the engine: a resource `SchemaService` does not know answers 404, a
  # generated schema is rendered compacted.
  class SchemaControllersTest < Minitest::Test

    def build(controller_class, path, params = {})
      controller = controller_class.new
      controller.request = ActionDispatch::TestRequest.create('PATH_INFO' => path)
      controller.params = params
      controller.define_singleton_method(:current_user) { nil }
      controller.define_singleton_method(:render) { |json:| @rendered = json }
      controller.define_singleton_method(:rendered) { @rendered }
      controller
    end

    def with_schema(method, schema, &block)
      Habarico::SchemaService.instance.stub(method, schema, &block)
    end

    def test_local_schema_of_an_unknown_resource_is_not_found
      with_schema(:get_local_schema, nil) do
        assert_raises(Eluvia::Errors::NotFound) { build(LocalSchemaController, '/admin/products/schema').index }
        assert_raises(Eluvia::Errors::NotFound) { build(LocalSchemaController, '/admin/products/7/schema', id: '7').show }
      end
    end

    def test_action_schema_of_an_unknown_resource_is_not_found
      with_schema(:get_action_schema, nil) do
        assert_raises(Eluvia::Errors::NotFound) { build(ActionSchemaController, '/admin/products/publish/schema').index }
        assert_raises(Eluvia::Errors::NotFound) { build(ActionSchemaController, '/admin/products/7/publish/schema', id: '7').show }
      end
    end

    def test_schema_is_rendered_compacted
      with_schema(:get_local_schema, { name: 'products', label: nil, actions: [{ name: 'detail', view: {} }] }) do
        controller = build(LocalSchemaController, '/admin/products/schema')
        controller.index

        assert_equal({ 'name' => 'products', 'actions' => [{ 'name' => 'detail' }] }, controller.rendered)
      end
    end

    def test_global_schema_is_rendered_compacted
      with_schema(:get_global_schema, [{ name: 'products', icon: nil }]) do
        controller = build(GlobalSchemaController, '/admin/schema')
        controller.index

        assert_equal [{ 'name' => 'products' }], controller.rendered
      end
    end

  end
end
