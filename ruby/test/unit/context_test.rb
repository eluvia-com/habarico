require 'test_helper'

class ContextTest < Minitest::Test

  # Minimal definition double exposing only the permission accessors the
  # Context reads. Using a plain double keeps the test independent of the
  # full Definition wiring (generators, model, etc.).
  def build_definition(can: nil, model: nil, **permissions)
    can_read   = permissions.fetch(:can_read,   true)
    can_create = permissions.fetch(:can_create, false)
    can_update = permissions.fetch(:can_update, false)
    can_delete = permissions.fetch(:can_delete, false)
    definition = Object.new
    definition.define_singleton_method(:can) { can }
    definition.define_singleton_method(:can_read) { can_read }
    definition.define_singleton_method(:can_create) { can_create }
    definition.define_singleton_method(:can_update) { can_update }
    definition.define_singleton_method(:can_delete) { can_delete }
    definition.define_singleton_method(:model) { model }
    definition
  end

  def build_context(definition:, record_pk: nil, current_user: nil)
    Habarico::Context.new(definition: definition, record_pk: record_pk, current_user: current_user)
  end

  # ***************************************************************************
  # Without record (global / list schema) — static booleans
  # ***************************************************************************

  def test_wo_record_static_true_boolean_grants
    context = build_context(definition: build_definition(can_read: true))
    assert_equal true, context.can?(:read)
  end

  def test_wo_record_static_false_boolean_denies
    context = build_context(definition: build_definition(can_create: false))
    assert_equal false, context.can?(:create)
  end

  # ***************************************************************************
  # Without record (global / list schema) — callables
  #
  # This is the HAB-572 regression: role-based callables that depend only on
  # current_user must be evaluated even without a record, otherwise a
  # restricted role receives the whole resource in the schema.
  # ***************************************************************************

  def test_wo_record_callable_is_evaluated_and_can_deny
    definition = build_definition(can_read: ->(_c) { false })
    context = build_context(definition: definition)
    assert_equal false, context.can?(:read)
  end

  def test_wo_record_callable_is_evaluated_and_can_grant
    definition = build_definition(can_read: ->(_c) { true })
    context = build_context(definition: definition)
    assert_equal true, context.can?(:read)
  end

  def test_wo_record_callable_receives_context_with_current_user
    user = Object.new
    seen_user = nil
    definition = build_definition(can_read: lambda { |c|
      seen_user = c.current_user
      true
    })
    context = build_context(definition: definition, current_user: user)
    assert_equal true, context.can?(:read)
    assert_same user, seen_user
  end

  def test_wo_record_callable_result_is_coerced_to_boolean
    definition = build_definition(can_read: ->(_c) { 'truthy' })
    context = build_context(definition: definition)
    assert_equal true, context.can?(:read)
  end

  # ***************************************************************************
  # Without record — non-standard permission via `can`
  # ***************************************************************************

  def test_wo_record_non_standard_static_denies_when_no_can_defined
    definition = build_definition(can: nil)
    context = build_context(definition: definition)
    assert_equal false, context.can?(:archive)
  end

  def test_wo_record_non_standard_callable_is_evaluated
    seen = nil
    definition = build_definition(can: lambda { |permission, _c|
      seen = permission
      permission == :archive
    })
    context = build_context(definition: definition)
    assert_equal true, context.can?(:archive)
    assert_equal :archive, seen
  end

  def test_wo_record_non_standard_callable_can_deny
    definition = build_definition(can: ->(_permission, _c) { false })
    context = build_context(definition: definition)
    assert_equal false, context.can?(:archive)
  end

  # ***************************************************************************
  # With record (detail schema) — callables evaluated against the record
  #
  # Ensures the VD-2625 per-record path still routes through can_with_record?
  # and evaluates callables with the concrete record available.
  # ***************************************************************************

  def test_with_record_uses_callable_and_can_read_record
    model = build_model_finding(record: :the_record)
    definition = build_definition(model: model, can_update: ->(c) { c.record == :the_record })
    context = build_context(definition: definition, record_pk: 'pk-1')
    assert_equal true, context.can?(:update)
  end

  def test_with_record_callable_denies_when_record_condition_false
    model = build_model_finding(record: :the_record)
    definition = build_definition(model: model, can_update: ->(c) { c.record == :other })
    context = build_context(definition: definition, record_pk: 'pk-1')
    assert_equal false, context.can?(:update)
  end

  def test_with_record_static_boolean_still_applies
    model = build_model_finding(record: :the_record)
    definition = build_definition(model: model, can_delete: true)
    context = build_context(definition: definition, record_pk: 'pk-1')
    assert_equal true, context.can?(:delete)
  end

  # ***************************************************************************
  # Blank permission defaults to :read
  # ***************************************************************************

  def test_blank_permission_defaults_to_read_wo_record
    definition = build_definition(can_read: true)
    context = build_context(definition: definition)
    assert_equal true, context.can?(nil)
  end

  private

  # Builds a model double whose `find_by` returns the given record, so the
  # Context can lazily resolve `record` from `record_pk`.
  def build_model_finding(record:)
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model.define_singleton_method(:find_by) { |_conditions| record }
    model
  end

end
