require 'test_helper'

class ViewEndpointParametersGeneratorTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model.define_singleton_method(:model_name) { ActiveModel::Name.new(model, nil, 'Thing') }
    model.define_singleton_method(:i18n_scope) { :activerecord }
    model.define_singleton_method(:columns_hash) { {} }
    model.define_singleton_method(:reflect_on_association) { |_| nil }
    model
  end

  def stub_context(record_pk: nil)
    ctx = Object.new
    ctx.define_singleton_method(:record_pk) { record_pk }
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
    Habarico::ViewEndpointParametersGenerator.new(build_definition, ['things'])
  end

  # ---------------------------------------------------------------------------
  # Argument validation
  # ---------------------------------------------------------------------------

  def test_raises_when_view_is_not_a_habarico_view
    assert_raises(Eluvia::Errors::StandardError) do
      build_generator.generate('not a view', stub_context)
    end
  end

  # ---------------------------------------------------------------------------
  # path - only action views carry one, the standard resource path is implicit
  # ---------------------------------------------------------------------------

  def test_path_is_nil_for_standard_view
    result = build_generator.generate(Habarico::ListView.new, stub_context)
    assert_nil result.path
  end

  def test_path_is_built_for_action_view
    view = Habarico::ActionView.new(name: 'approve', endpoint_action_name: 'approve')
    result = build_generator.generate(view, stub_context)
    assert_equal '/things/approve/', result.path
  end

  def test_path_includes_record_pk_for_detail_action_view
    view = Habarico::ActionView.new(name: 'approve', endpoint_action_name: 'approve', is_detail: true)
    result = build_generator.generate(view, stub_context(record_pk: 42))
    assert_equal '/things/42/approve/', result.path
  end

  # ---------------------------------------------------------------------------
  # One address, beside `path` and `method`: how a thing is called is not part
  # of where it is. `record_pk` is not part of a view endpoint - it belongs to
  # the action and menu addresses, which target a record from elsewhere
  # ---------------------------------------------------------------------------

  def test_record_pk_is_not_part_of_a_view_endpoint
    view = Habarico::ActionView.new(name: 'approve', endpoint_action_name: 'approve', is_detail: true)
    result = build_generator.generate(view, stub_context(record_pk: 42))
    assert_nil result.reference.record_pk
  end

  def test_emitted_keys_match_the_contract
    view = Habarico::ActionView.new(name: 'approve', endpoint_action_name: 'approve')
    result = build_generator.generate(view, stub_context)
    assert_equal %w[method path reference], result.as_json.keys.sort
  end

  def test_the_action_segment_lives_inside_the_address
    view = Habarico::ActionView.new(name: 'approve', endpoint_action_name: 'approve')
    reference = build_generator.generate(view, stub_context).reference
    assert_equal 'approve', reference.action_name
    assert_equal 'things', reference.resource, 'an action name needs a resource to belong to'
  end

  def test_a_standard_view_carries_no_address
    result = build_generator.generate(Habarico::ListView.new, stub_context)
    assert_nil result.reference, 'absent means the resource the schema was generated for'
  end

end
