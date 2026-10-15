require_relative "../../integration/integration_helper"
require "habarico/contrib/preferences"

class PreferencesModelTest < Minitest::Test
  Model = Habarico::Contrib::Preferences::UserPreference

  def setup
    Model.delete_all
  end

  def test_persists_and_reads_a_value
    record = Model.create!(id: SecureRandom.uuid, user_id: "u1", key: "theme", value: "dark")
    assert_equal "dark", Model.find(record.id).value
    assert_equal "habarico_user_preferences", Model.table_name
  end

  def test_unique_per_user_and_key
    Model.create!(id: SecureRandom.uuid, user_id: "u1", key: "theme", value: "dark")
    assert_raises(ActiveRecord::RecordNotUnique) do
      Model.create!(id: SecureRandom.uuid, user_id: "u1", key: "theme", value: "light")
    end
  end
end

class PreferencesResolutionTest < Minitest::Test
  P = Habarico::Contrib::Preferences
  Model = Habarico::Contrib::Preferences::UserPreference

  def setup
    P.registry._clear
    Model.delete_all
    P.register_preference("theme", schema: { "enum" => %w[light dark] }, default: "light")
    P.register_preference("locale", schema: { "type" => "string" }) # no default
    P.register_preference_pattern(%r{[a-zA-Z][a-zA-Z0-9_./-]*\.columns}, schema: { "type" => "array" })
  end

  def test_get_value_returns_default_when_unset
    resolved = P.get_value("u1", "theme")
    assert_equal "theme", resolved.key
    assert_equal "light", resolved.value
    assert_nil resolved.updated_at
  end

  def test_get_value_nil_when_no_value_and_no_default
    assert_nil P.get_value("u1", "locale")
  end

  def test_set_then_get_roundtrip_with_timestamp
    stored = P.set_value("u1", "theme", "dark")
    assert_equal "dark", stored.value
    refute_nil stored.updated_at
    assert_equal "dark", P.get_value("u1", "theme").value
  end

  def test_set_value_validates
    assert_raises(P::PreferenceValidationError) { P.set_value("u1", "theme", "purple") }
  end

  def test_set_value_upserts
    P.set_value("u1", "theme", "dark")
    P.set_value("u1", "theme", "light")
    assert_equal "light", P.get_value("u1", "theme").value
    assert_equal 1, Model.where(user_id: "u1", key: "theme").count
  end

  def test_get_value_self_heals_invalid_stored_value
    Model.create!(id: SecureRandom.uuid, user_id: "u1", key: "theme", value: "purple")
    resolved = P.get_value("u1", "theme")
    assert_equal "light", resolved.value              # fell back to default
    assert_equal 0, Model.where(user_id: "u1", key: "theme").count # invalid row deleted
  end

  def test_get_values_merges_stored_and_defaults_sorted
    P.set_value("u1", "theme", "dark")
    values = P.get_values("u1")
    keys = values.map(&:key)
    assert_equal keys.sort, keys                       # sorted by key
    assert_includes keys, "theme"
    theme = values.find { |v| v.key == "theme" }
    assert_equal "dark", theme.value
    refute_includes keys, "locale"                     # no value + no default => omitted
  end

  def test_get_values_deletes_unregistered_stored_key
    Model.create!(id: SecureRandom.uuid, user_id: "u1", key: "gone", value: 1)
    keys = P.get_values("u1").map(&:key)
    refute_includes keys, "gone"
    assert_equal 0, Model.where(user_id: "u1", key: "gone").count
  end

  def test_delete_value_and_delete_values
    P.set_value("u1", "theme", "dark")
    P.set_value("u1", "cols.columns", %w[a b]) rescue nil
    P.delete_value("u1", "theme")
    assert_nil Model.find_by(user_id: "u1", key: "theme")
    assert_raises(P::PreferenceNotRegistered) { P.delete_value("u1", "missing") }
    P.set_value("u1", "theme", "dark")
    P.delete_values("u1")
    assert_equal 0, Model.where(user_id: "u1").count
  end
end
