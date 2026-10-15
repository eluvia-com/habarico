require 'test_helper'

class ObjectResourceSchemaGeneratorTest < Minitest::Test

  def stub_model(pk = 'id')
    model = Object.new
    model.define_singleton_method(:primary_key) { pk }
    model
  end

  def stub_context(can_read: true, record_pk: 1)
    ctx = Object.new
    ctx.define_singleton_method(:can?) { |_permission| can_read }
    ctx.define_singleton_method(:record_pk) { record_pk }
    ctx
  end

  def build_definition
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.label = 'Things'
    definition.actions = []
    definition
  end

  def build_generator(actions: [])
    definition = build_definition
    definition.actions = actions
    Habarico::ObjectResourceSchemaGenerator.new(definition, ['things'])
  end

  # *****************************************************************************
  # generate_actions tests
  #
  # Object-level action meta must be identical regardless of which endpoint
  # (list index vs single-object show/update) produced it, so the frontend can
  # merge a detail-endpoint response into a list row without losing actions.
  # *****************************************************************************

  def test_generate_actions_returns_empty_array_when_no_actions_defined
    generator = build_generator
    result = generator.send(:generate_actions, :list, stub_context)
    assert_equal [], result
  end

  def test_generate_actions_filters_out_denied_actions
    generator = build_generator(actions: [:show])
    result = generator.send(:generate_actions, :list, stub_context(can_read: false))
    assert_equal [], result
  end

  def test_generate_actions_includes_delete_for_list_view_type
    generator = build_generator(actions: [:delete])
    result = generator.send(:generate_actions, :list, stub_context)
    assert_equal 1, result.size
    assert_equal 'delete', result[0].name
  end

  def test_generate_actions_includes_delete_for_detail_view_type
    # Regression test: delete has show_in_detail = false, so it used to be
    # dropped from the :detail view_type even though it's a record-bound
    # (is_detail = true) action. Object meta must be endpoint-independent.
    generator = build_generator(actions: [:delete])
    result = generator.send(:generate_actions, :detail, stub_context)
    assert_equal 1, result.size
    assert_equal 'delete', result[0].name
  end

  def test_generate_actions_for_list_and_detail_view_types_are_identical
    generator = build_generator(actions: %i[show edit delete])
    list_result = generator.send(:generate_actions, :list, stub_context)
    detail_result = generator.send(:generate_actions, :detail, stub_context)
    assert_equal list_result.map(&:name), detail_result.map(&:name)
  end

  def test_generate_actions_excludes_create_because_it_is_not_record_bound
    # create is not tied to a specific record (is_detail = false), so it must
    # never appear in per-object action meta, regardless of view_type.
    generator = build_generator(actions: [:create])
    assert_equal [], generator.send(:generate_actions, :list, stub_context)
    assert_equal [], generator.send(:generate_actions, :detail, stub_context)
  end

  def test_generate_actions_includes_show_and_edit_for_both_view_types
    generator = build_generator(actions: %i[show edit])
    %i[list detail].each do |view_type|
      result = generator.send(:generate_actions, view_type, stub_context)
      assert_equal %w[show edit], result.map(&:name)
    end
  end

  # *****************************************************************************
  # Full generate output tests
  # *****************************************************************************

  def test_generate_returns_object_resource_schema_instance
    schema = build_generator.generate(:detail, stub_context)
    assert_instance_of Habarico::ObjectResourceSchema, schema
  end

  def test_generate_schema_actions_are_endpoint_independent
    definition = build_definition
    definition.actions = %i[show edit delete]
    generator = Habarico::ObjectResourceSchemaGenerator.new(definition, ['things'])
    list_schema = generator.generate(:list, stub_context)
    detail_schema = generator.generate(:detail, stub_context)
    assert_equal list_schema.actions.map(&:name), detail_schema.actions.map(&:name)
    assert_includes detail_schema.actions.map(&:name), 'delete'
  end

end
