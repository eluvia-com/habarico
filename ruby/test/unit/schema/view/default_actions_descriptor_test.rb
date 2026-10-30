require 'test_helper'

# A slot holds two kinds of entry, told apart by `type`: one naming a single action, one standing for
# a resource's defaults. These cover the second one and the parts the first one gained with it.
class DefaultActionsDescriptorTest < Minitest::Test

  def test_type_is_emitted
    assert_equal 'default_actions', Habarico::DefaultActionsDescriptor.new.type
  end

  def test_scope_narrows_which_actions_expand
    assert_equal 'detail', Habarico::DefaultActionsDescriptor.new(scope: :detail).scope
  end

  def test_the_scope_enum_is_the_contracts
    assert_equal %i[list detail all], Habarico::Types::ACTION_SCOPE_TYPE
    assert Habarico::DefaultActionsDescriptor.has_enum_attr?(:scope)
  end

  def test_reference_is_an_address
    reference = Habarico::ResourceReference.build('eshop/order_item')
    descriptor = Habarico::DefaultActionsDescriptor.new(reference: reference)
    assert_equal 'eshop', descriptor.reference.service
    assert_equal 'order_item', descriptor.reference.resource
  end

  def test_an_absent_reference_means_the_resource_the_slot_is_read_in
    assert_nil Habarico::DefaultActionsDescriptor.new.reference
  end

end

class ActionDescriptorTypeTest < Minitest::Test

  def test_type_is_emitted
    assert_equal 'action', Habarico::ActionDescriptor.new(name: 'edit').type
  end

  def test_reference_is_an_address
    descriptor = Habarico::ActionDescriptor.new(name: 'create', reference: Habarico::ResourceReference.build('order_item'))
    assert_nil descriptor.reference.service
    assert_equal 'order_item', descriptor.reference.resource
  end

  def test_confirm_dialog_overrides_the_actions_own
    dialog = Habarico::ConfirmDialogProperties.new(title: 'Delete photo', message: 'The file goes too.')
    assert_equal 'Delete photo', Habarico::ActionDescriptor.new(name: 'delete', confirm_dialog: dialog).confirm_dialog.title
  end

end

class ResourceReferenceTest < Minitest::Test

  def test_a_bare_name_is_the_resource
    reference = Habarico::ResourceReference.build('teacher')
    assert_nil reference.service
    assert_equal 'teacher', reference.resource
  end

  def test_a_prefixed_name_splits_in_two
    reference = Habarico::ResourceReference.build('school/teacher')
    assert_equal 'school', reference.service
    assert_equal 'teacher', reference.resource
  end

  def test_every_part_is_carried
    reference = Habarico::ResourceReference.build(
      'school/teacher',
      record_pk: 7,
      action_name: 'approve',
      params: { '_target' => '{"school":7}' },
    )
    assert_equal '7', reference.record_pk
    assert_equal 'approve', reference.action_name
    assert_equal({ '_target' => '{"school":7}' }, reference.params)
  end

  def test_qualified_name_joins_the_halves_a_query_string_names_a_resource_by
    assert_equal 'school/teacher', Habarico::ResourceReference.build('school/teacher').qualified_name
    assert_equal 'teacher', Habarico::ResourceReference.build('teacher').qualified_name
  end

  def test_an_address_is_refused_where_a_name_is_expected
    # `build` composes an address from a name; an author who has one already does not need it, and
    # silently stringifying the object produced a resource called `#<Habarico::ResourceReference…>`.
    address = Habarico::ResourceReference.build('school/teacher')
    error = assert_raises(StandardError) { Habarico::ResourceReference.build(address) }
    assert_match 'is an address already', error.message
  end

  def test_a_sentinel_is_refused_where_a_name_is_expected
    error = assert_raises(StandardError) { Habarico::ResourceReference.build(Habarico::ResourceReference::CURRENT) }
    assert_match 'stands in place of an address', error.message
  end

  def test_the_sentinels_are_written_the_way_they_read
    assert_equal 'CURRENT', Habarico::ResourceReference::CURRENT.to_s
    assert_equal 'LIST', Habarico::ResourceReference::LIST.to_s
  end

end
