require 'test_helper'

class FieldDescriptorGeneratorTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model.define_singleton_method(:model_name) { ActiveModel::Name.new(model, nil, 'Thing') }
    model.define_singleton_method(:i18n_scope) { :activerecord }
    model.define_singleton_method(:columns_hash) { {} }
    model.define_singleton_method(:reflect_on_association) { |_| nil }
    model
  end

  def stub_context(can_read: true)
    ctx = Object.new
    ctx.define_singleton_method(:can?) { |_permission| can_read }
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
    Habarico::FieldDescriptorGenerator.new(build_definition, ['things'])
  end

  def field_ref(attrs = {})
    ref = Habarico::FieldReference.new
    ref.name = attrs.fetch(:name, 'title')
    ref.action = attrs[:action]
    ref.wrapper = attrs[:wrapper]
    ref
  end

  # -------------------------------------------------------------------------
  # generate_action tests
  # -------------------------------------------------------------------------

  def test_generate_action_returns_nil_by_default
    generator = build_generator
    ref = field_ref
    assert_nil generator.send(:generate_action, stub_model, ref, stub_context)
  end

  def test_generate_action_returns_action_descriptor_when_action_set
    generator = build_generator
    action_ref = Habarico::ActionReference.new(name: 'show')
    action_ref.permission = nil
    ref = field_ref(action: action_ref)
    result = generator.send(:generate_action, stub_model, ref, stub_context)
    refute_nil result
    assert_instance_of Habarico::ActionDescriptor, result
    assert_equal 'show', result.name
  end

  # -------------------------------------------------------------------------
  # generate_wrapper tests
  # -------------------------------------------------------------------------

  def test_generate_wrapper_returns_nil_by_default
    generator = build_generator
    ref = field_ref
    assert_nil generator.send(:generate_wrapper, stub_model, ref, stub_context)
  end

  def test_generate_wrapper_returns_wrapper_when_set
    generator = build_generator
    inner = Habarico::FieldDescriptor.new(name: 'first_name', type: 'field')
    wrapper = Habarico::FieldWrapperProperties.new(fields: [inner])
    ref = field_ref(wrapper: wrapper)
    result = generator.send(:generate_wrapper, stub_model, ref, stub_context)
    assert_equal wrapper, result
  end

  # -------------------------------------------------------------------------
  # Full generate output tests
  # -------------------------------------------------------------------------

  def test_generate_produces_field_descriptor
    generator = build_generator
    result = generator.generate(stub_model, 'title', stub_context)
    assert_instance_of Habarico::FieldDescriptor, result
  end

  def test_generate_schema_has_action_when_set
    generator = build_generator
    action_ref = Habarico::ActionReference.new(name: 'show')
    action_ref.permission = nil
    ref = field_ref(action: action_ref)
    result = generator.generate(stub_model, ref, stub_context)
    refute_nil result.action
    assert_equal 'show', result.action.name
  end

  def test_generate_schema_has_no_action_by_default
    generator = build_generator
    result = generator.generate(stub_model, 'title', stub_context)
    assert_nil result.action
  end

  def test_generate_schema_has_wrapper_when_set
    generator = build_generator
    inner = Habarico::FieldDescriptor.new(name: 'first_name', type: 'field')
    wrapper = Habarico::FieldWrapperProperties.new(fields: [inner])
    ref = field_ref(wrapper: wrapper)
    result = generator.generate(stub_model, ref, stub_context)
    refute_nil result.wrapper
    assert_equal 1, result.wrapper.fields.length
    assert_equal 'first_name', result.wrapper.fields[0].name
  end

  def test_generate_schema_has_no_wrapper_by_default
    generator = build_generator
    result = generator.generate(stub_model, 'title', stub_context)
    assert_nil result.wrapper
  end

end
