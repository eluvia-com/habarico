require 'test_helper'

# A trigger action is given as a declared action's name, an action object or a ready schema, and
# may be retargeted at another record and resource.
class TriggerActionSchemaGeneratorTest < Minitest::Test

  PRODUCT_PK = '11111111-1111-4111-8111-111111111111'.freeze
  CATEGORY_PK = '22222222-2222-4222-8222-222222222222'.freeze

  def stub_context(record_pk: PRODUCT_PK)
    ctx = Object.new
    ctx.define_singleton_method(:record_pk) { record_pk }
    ctx.define_singleton_method(:can?) { |_permission| true }
    ctx
  end

  def setup
    @previous_resources = Habarico::Config.resources
    Habarico::Config.resources = %i[products categories]

    @edit_price = Habarico::ViewAction.new(name: 'edit_price', view_name: 'edit', view_mode: :dialog, is_detail: true)
    @definition = Habarico::Definition.new
    @definition.actions = [@edit_price, :delete]
  end

  def teardown
    Habarico::Config.resources = @previous_resources
  end

  def generate(action, **options)
    Habarico::TriggerActionSchemaGenerator.new(@definition, [:products]).generate(action, stub_context, **options)
  end

  def test_nil_generates_no_schema
    assert_nil generate(nil)
  end

  def test_a_declared_action_is_found_by_name
    schema = generate('edit_price')

    assert_equal 'edit', schema.view.name
    assert_equal PRODUCT_PK, schema.view.reference.record_pk
  end

  def test_a_standard_action_declared_as_a_symbol_is_found_by_name
    assert_equal :resource, generate(:delete).type.to_sym
  end

  def test_an_unknown_name_raises_with_the_declared_names
    error = assert_raises(Eluvia::Errors::StandardError) { generate('edit_prices') }

    assert_includes error.message, '`products`'
    assert_includes error.message, 'edit_price, delete'
  end

  def test_a_ready_schema_is_returned_as_is
    schema = Habarico::ActionSchema.new(type: :link)

    assert_same schema, generate(schema)
  end

  def test_anything_else_raises
    error = assert_raises(Eluvia::Errors::StandardError) { generate(42) }

    assert_includes error.message, 'Integer'
  end

  def test_record_pk_and_reference_retarget_the_action
    reference = generate('edit_price', record_pk: CATEGORY_PK, reference: 'categories').view.reference

    assert_equal CATEGORY_PK, reference.record_pk
    assert_equal 'categories', reference.resource
  end

  def test_retargeting_does_not_mutate_the_declared_action
    generate('edit_price', record_pk: CATEGORY_PK, reference: 'categories')

    assert_nil @edit_price.endpoint_record_pk
    assert_nil @edit_price.endpoint_reference
  end

end
