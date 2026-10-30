require 'test_helper'

# A slot the admin author left alone carries a `default_actions` entry, which the client expands into
# the resource's own actions; `nil` and `[]` are both decisions to render nothing. The defaults are
# therefore in the schema, readable, rather than reconstructed by the client.
class DefaultActionsSlotsTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model
  end

  def definition
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    definition
  end

  def context
    context = Habarico::Context.new
    context.define_singleton_method(:can?) { |_permission| true }
    context
  end

  def list_slots(view)
    Habarico::ListViewParametersGenerator.new(definition, ['articles']).generate(view, context)
  end

  def detail_slots(view)
    Habarico::DetailViewParametersGenerator.new(definition, ['articles']).generate(view, context)
  end

  # --- a list view -----------------------------------------------------------

  def test_row_actions_default_to_the_records_own
    slot = list_slots(Habarico::ListView.new).row_actions

    assert_equal 1, slot.length
    assert_equal 'default_actions', slot[0].type
    assert_equal 'detail', slot[0].scope
  end

  def test_the_toolbar_defaults_to_everything_supported
    slot = list_slots(Habarico::ListView.new).toolbar_actions

    assert_equal 'default_actions', slot[0].type
    assert_nil slot[0].scope, 'an absent scope is read as `all`'
  end

  def test_the_slot_names_no_resource
    slot = list_slots(Habarico::ListView.new).row_actions

    assert_nil slot[0].reference, "a view's own slot is read in the schema it belongs to"
  end

  def test_list_actions_stay_empty
    assert_nil list_slots(Habarico::ListView.new).list_actions, 'the client never inferred these'
  end

  # --- turning a default off -------------------------------------------------

  def test_a_declared_slot_is_left_as_declared
    slot = list_slots(Habarico::ListView.new(row_actions: ['edit'])).row_actions

    assert_equal 'action', slot[0].type
    assert_equal 'edit', slot[0].name
  end

  def test_nil_turns_the_default_off
    assert_nil list_slots(Habarico::ListView.new(row_actions: nil)).row_actions
  end

  def test_an_explicitly_empty_slot_stays_empty
    assert_equal [], list_slots(Habarico::ListView.new(row_actions: [])).row_actions
  end

  # --- a detail view ---------------------------------------------------------

  def test_a_detail_toolbar_defaults_to_everything_supported
    slot = detail_slots(Habarico::ShowView.new).toolbar_actions

    assert_equal 'default_actions', slot[0].type
    assert_nil slot[0].reference
  end

  def test_nil_turns_a_detail_toolbar_off
    assert_nil detail_slots(Habarico::ShowView.new(toolbar_actions: nil)).toolbar_actions
  end
end
