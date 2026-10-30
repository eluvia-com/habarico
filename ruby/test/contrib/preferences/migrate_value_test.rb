require_relative "../../integration/integration_helper"
require "habarico/contrib/preferences"

# A stored value that no longer validates is repaired before it would be deleted, which is how the
# package that owns a shape changes it without a data migration.
class PreferencesMigrateValueTest < Minitest::Test
  P = Habarico::Contrib::Preferences
  Model = P::UserPreference

  SCHEMA = { "type" => "object", "required" => %w[columns], "properties" => { "columns" => { "type" => "array" } } }.freeze

  def setup
    Model.delete_all
    P.registry._clear
  end

  def teardown
    P.registry._clear
  end

  def store(value)
    Model.create!(id: SecureRandom.uuid, user_id: "u1", key: "table", value: value)
  end

  def test_a_migrated_value_is_returned_and_saved
    P.register_preference("table", schema: SCHEMA, migrate_value: ->(value) { { "columns" => [value["column"]] } })
    store("column" => "name")

    resolved = P.get_value("u1", "table")

    assert_equal({ "columns" => ["name"] }, resolved.value)
    assert_equal({ "columns" => ["name"] }, Model.find_by(user_id: "u1", key: "table").value, "the repair runs once, not on every read")
  end

  def test_a_migration_that_does_not_validate_leaves_the_value_to_be_deleted
    P.register_preference("table", schema: SCHEMA, migrate_value: ->(_value) { { "columns" => "not an array" } })
    store("column" => "name")

    assert_nil P.get_value("u1", "table")
    assert_nil Model.find_by(user_id: "u1", key: "table")
  end

  def test_a_migration_that_raises_leaves_the_value_to_be_deleted
    P.register_preference("table", schema: SCHEMA, migrate_value: ->(_value) { raise "schema bug" })
    store("column" => "name")

    assert_nil P.get_value("u1", "table"), "a schema's own bug must not make reading preferences fail"
    assert_nil Model.find_by(user_id: "u1", key: "table")
  end

  def test_without_a_migration_an_invalid_value_is_deleted_as_before
    P.register_preference("table", schema: SCHEMA)
    store("column" => "name")

    assert_nil P.get_value("u1", "table")
    assert_nil Model.find_by(user_id: "u1", key: "table")
  end

  def test_a_valid_value_never_reaches_the_migration
    P.register_preference("table", schema: SCHEMA, migrate_value: ->(_value) { raise "must not be called" })
    store("columns" => %w[name])

    assert_equal({ "columns" => %w[name] }, P.get_value("u1", "table").value)
  end
end
