require "test_helper"
require "minitest/mock"

# Top-level so `Habarico::ResourceService` resolves the `products` resource to it by name, the way
# a host app's controller is resolved. `record_serializer` below needs that resolution.
class ProductsController < ActionController::Base
  include Habarico::Controller

  PRODUCT_PK = '11111111-1111-4111-8111-111111111111'.freeze
  CATEGORY_PK = '22222222-2222-4222-8222-222222222222'.freeze

  # Minimal stand-in for an ActiveRecord model: the paths under test only ever read the primary
  # key of the record in the context.
  class Product
    attr_reader :id, :name

    def initialize(id, name)
      @id = id
      @name = name
    end

    def to_s
      name
    end
  end

  model Product
  fields %w[id name]
  actions [
    Habarico::ViewAction.new(name: 'edit_price', view_name: 'edit', view_mode: :dialog, is_detail: true),
    Habarico::ResourceAction.new(name: 'publish', endpoint_method: :put, is_detail: true)
  ]

  # Captures what `render_response` renders instead of writing a real response.
  attr_reader :rendered

  def render(json:)
    @rendered = json
  end

  def current_user
    nil
  end
end

module Habarico
  # ***************************************************************************
  # The action response must follow the `ActionResult` contract - message, state and
  # trigger_action under `meta`, the response's own data next to it.
  # ***************************************************************************

  class ActionResponseTest < Minitest::Test

    PRODUCT_PK = ProductsController::PRODUCT_PK
    CATEGORY_PK = ProductsController::CATEGORY_PK

    def setup
      @previous_resources = Habarico::Config.resources
      Habarico::Config.resources = %i[products categories]
      @controller = ProductsController.new
      @controller.params = {}
      @controller.instance_variable_set(:@record, ProductsController::Product.new(PRODUCT_PK, 'Espresso machine'))
    end

    def teardown
      Habarico::Config.resources = @previous_resources
    end

    # Renders `response` and returns the JSON the client receives - the assertions are on the wire
    # shape, not on the Ruby objects behind it.
    def render(response)
      @controller.send(:render_response, response)
      JSON.parse(@controller.rendered.to_json)
    end

    # ***********************************************************************
    # The `meta` envelope
    # ***********************************************************************

    def test_message_and_state_are_rendered_under_meta
      result = render(Habarico::Response.new(message: 'Product has been published.'))

      assert_equal({ 'message' => 'Product has been published.', 'state' => 'success' }, result['meta'])
    end

    def test_message_and_state_are_not_rendered_at_the_top_level
      result = render(Habarico::Response.new(message: 'Product has been published.'))

      assert_equal %w[meta], result.keys
    end

    def test_message_is_omitted_when_the_response_carries_none
      result = render(Habarico::Response.new)

      assert_equal({ 'state' => 'success' }, result['meta'])
    end

    def test_running_state_of_a_background_action_reaches_meta
      result = render(Habarico::Response.new(state: :running))

      assert_equal 'running', result['meta']['state']
    end

    def test_response_data_is_merged_next_to_meta
      result = render(Habarico::Response.new(message: 'Invoice issued.', data: { 'invoice_number' => 'INV-2026-0042' }))

      assert_equal 'INV-2026-0042', result['invoice_number']
      assert_equal 'Invoice issued.', result['meta']['message']
    end

    # ***********************************************************************
    # `action:` given as the name of a declared action
    # ***********************************************************************

    def test_trigger_action_by_name_targets_the_record_the_action_ran_on
      result = render(Habarico::Response.new(action: 'edit_price'))

      trigger = result['meta']['trigger_action']
      assert_equal 'view', trigger['type']
      assert_equal 'edit', trigger['view']['name']
      assert_equal PRODUCT_PK, trigger['view']['endpoint']['record_pk']
    end

    def test_trigger_action_by_name_accepts_a_symbol
      result = render(Habarico::Response.new(action: :publish))

      assert_equal 'resource', result['meta']['trigger_action']['type']
    end

    def test_trigger_action_by_unknown_name_raises_instead_of_rendering_nothing
      error = assert_raises(Eluvia::Errors::StandardError) do
        render(Habarico::Response.new(action: 'edit_prices'))
      end

      assert_includes error.message, 'edit_prices'
      assert_includes error.message, 'edit_price'
    end

    # ***********************************************************************
    # `action:` given as an object - an ad-hoc action or a ready schema
    # ***********************************************************************

    def test_trigger_action_accepts_an_action_the_resource_does_not_declare
      action = Habarico::LinkAction.new(name: 'open_invoice', link_url: 'https://invoices.example.com/INV-2026-0042',
                                        link_target: :blank)
      result = render(Habarico::Response.new(action: action))

      trigger = result['meta']['trigger_action']
      assert_equal 'link', trigger['type']
      assert_equal 'https://invoices.example.com/INV-2026-0042', trigger['link']['url']
    end

    def test_trigger_action_accepts_a_ready_action_schema
      schema = Habarico::ActionSchema.new(
        type: :view,
        is_detail: true,
        view: Habarico::ViewActionParameters.new(
          name: 'show',
          mode: :redirect,
          endpoint: Habarico::ViewActionEndpointParameters.new(reference: 'categories', record_pk: CATEGORY_PK)
        )
      )
      result = render(Habarico::Response.new(action: schema))

      trigger = result['meta']['trigger_action']
      assert_equal 'categories', trigger['view']['endpoint']['reference']
      assert_equal CATEGORY_PK, trigger['view']['endpoint']['record_pk']
    end

    def test_trigger_action_of_an_unsupported_type_raises
      error = assert_raises(Eluvia::Errors::StandardError) do
        render(Habarico::Response.new(action: 42))
      end

      assert_includes error.message, 'Integer'
    end

    # ***********************************************************************
    # An explicit target: another resource, another record
    # ***********************************************************************

    def test_trigger_action_opens_a_view_of_another_resource_over_a_foreign_record
      action = Habarico::ViewAction.new(name: 'show', view_name: 'show', view_mode: :redirect, is_detail: true,
                                        endpoint_reference: 'categories', endpoint_record_pk: CATEGORY_PK)
      result = render(Habarico::Response.new(action: action))

      endpoint = result['meta']['trigger_action']['view']['endpoint']
      assert_equal 'categories', endpoint['reference']
      assert_equal CATEGORY_PK, endpoint['record_pk']
      # A standard action name must not put the current resource's own action name on the endpoint.
      assert_nil endpoint['action_name']
    end

    def test_trigger_action_calls_a_resource_endpoint_of_another_resource
      action = Habarico::ResourceAction.new(name: 'recount', endpoint_method: :put, is_detail: true,
                                           endpoint_reference: 'categories', endpoint_record_pk: CATEGORY_PK)
      result = render(Habarico::Response.new(action: action))

      endpoint = result['meta']['trigger_action']['resource']['endpoint']
      assert_equal "/categories/#{CATEGORY_PK}/recount/", endpoint['path']
      assert_equal 'put', endpoint['method']
      assert_equal 'categories', endpoint['reference']
      assert_equal CATEGORY_PK, endpoint['record_pk']
    end

    def test_trigger_action_targets_another_record_of_the_same_resource
      action = @controller.class.definition.normalized_actions.find { |a| a.name == 'edit_price' }
      schema = @controller.send(:trigger_action_schema, action, record_pk: CATEGORY_PK)
      result = render(Habarico::Response.new(action: schema))

      assert_equal CATEGORY_PK, result['meta']['trigger_action']['view']['endpoint']['record_pk']
    end

    def test_trigger_action_schema_retargets_a_declared_action_given_by_name
      schema = @controller.send(:trigger_action_schema, 'edit_price', record_pk: CATEGORY_PK, reference: 'categories')

      assert_equal CATEGORY_PK, schema.view.endpoint.record_pk
      assert_equal 'categories', schema.view.endpoint.reference
    end

    # ***********************************************************************
    # The document as a whole
    # ***********************************************************************

    # Asserts the full rendered document rather than individual keys, so a stray top-level key or
    # a wrong nesting level fails the test even if every field value on its own is correct.
    def test_the_whole_document_matches_the_action_result_contract
      action = Habarico::ViewAction.new(name: 'show', view_name: 'show', view_mode: :redirect, is_detail: true,
                                        endpoint_reference: 'categories', endpoint_record_pk: CATEGORY_PK)
      result = render(Habarico::Response.new(message: 'Product has been published.', action: action))

      assert_equal({
        'meta' => {
          'message' => 'Product has been published.',
          'state' => 'success',
          'trigger_action' => {
            'type' => 'view',
            'is_detail' => true,
            'view' => {
              'name' => 'show',
              'mode' => 'redirect',
              'endpoint' => {
                'reference' => 'categories',
                'record_pk' => CATEGORY_PK
              }
            }
          }
        }
      }, result)
    end

    # ***********************************************************************
    # The same schema through `get_trigger_action_schema`, on a serialized record
    # ***********************************************************************

    # The object schema is generated by a whole layer of its own and says nothing about the trigger
    # action, so it is stubbed out here with the minimum `MetaSerializer` reads.
    OBJECT_SCHEMA = {
      'name' => 'products',
      'label' => 'Products',
      'pk_field_name' => 'id',
      'actions' => []
    }.freeze

    def serialize_record(controller, record)
      Habarico::SchemaService.instance.stub(:get_object_schema, OBJECT_SCHEMA) do
        controller.send(:record_serializer).serialize(:detail, record)
      end
    end

    def test_get_trigger_action_schema_reaches_the_meta_of_a_serialized_record
      controller = Class.new(ProductsController) do
        def get_trigger_action_schema(record)
          trigger_action_schema(
            Habarico::ViewAction.new(name: 'show', view_name: 'show', view_mode: :dialog, is_detail: true),
            record: record,
            reference: 'categories',
            record_pk: CATEGORY_PK
          )
        end
      end.new
      controller.params = {}
      record = ProductsController::Product.new(PRODUCT_PK, 'Espresso machine')

      result = serialize_record(controller, record)

      endpoint = result['meta']['trigger_action']['view']['endpoint']
      assert_equal 'categories', endpoint['reference']
      assert_equal CATEGORY_PK, endpoint['record_pk']
      assert_equal 'dialog', result['meta']['trigger_action']['view']['mode']
    end

    # Without a record of its own, as on a list: the trigger action must target the record the
    # hook was called with, not the request's.
    def list_controller(&hook)
      controller = ProductsController.new
      controller.define_singleton_method(:get_trigger_action_schema, &hook)
      controller.params = {}
      controller
    end

    def test_get_trigger_action_schema_may_answer_a_declared_action_name
      record = ProductsController::Product.new(CATEGORY_PK, 'Grinder')

      trigger = serialize_record(list_controller { |_record| 'edit_price' }, record)['meta']['trigger_action']

      assert_equal 'edit', trigger['view']['name']
      assert_equal CATEGORY_PK, trigger['view']['endpoint']['record_pk']
    end

    def test_get_trigger_action_schema_may_answer_an_action
      record = ProductsController::Product.new(PRODUCT_PK, 'Espresso machine')
      controller = list_controller do |_record|
        Habarico::LinkAction.new(name: 'open_manual', link_url: 'https://manuals.example.com/espresso', link_target: :blank)
      end

      trigger = serialize_record(controller, record)['meta']['trigger_action']

      assert_equal 'link', trigger['type']
      assert_equal 'https://manuals.example.com/espresso', trigger['link']['url']
    end

    def test_get_trigger_action_schema_answering_nil_adds_no_trigger_action
      record = ProductsController::Product.new(PRODUCT_PK, 'Espresso machine')

      refute serialize_record(list_controller { |_record| nil }, record)['meta'].key?('trigger_action')
    end

    def test_serialized_record_has_no_trigger_action_without_the_hook
      record = ProductsController::Product.new(PRODUCT_PK, 'Espresso machine')

      result = serialize_record(@controller, record)

      refute result['meta'].key?('trigger_action')
    end

  end
end
