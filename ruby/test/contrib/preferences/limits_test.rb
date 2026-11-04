require_relative "../../integration/integration_helper"
require "habarico/contrib/preferences"

# Size guard: `max_value_bytes` caps the serialized size of a single preference value.
class PreferencesValueSizeLimitTest < Minitest::Test
  P = Habarico::Contrib::Preferences
  Model = Habarico::Contrib::Preferences::UserPreference

  COLUMNS = { "type" => "array", "items" => { "type" => "string" } }.freeze

  def setup
    @original_value_bytes = P.max_value_bytes
    @original_keys = P.max_keys_per_user
    P.registry._clear
    Model.delete_all
    P.max_value_bytes = { "default" => 200 }
  end

  def teardown
    P.max_value_bytes = @original_value_bytes
    P.max_keys_per_user = @original_keys
  end

  # A limit a gem registers with the key is a default: the deployment's `max_value_bytes` outranks
  # it, so a host can raise what `habarico-enterprise` sets for `preferences.dashboard`.
  def test_a_configured_limit_outranks_a_registered_one
    P.max_value_bytes = { "default" => 200, "product.columns" => 999 }
    P.register_preference("product.columns", schema: COLUMNS, max_bytes: 300)

    assert_equal 999, P.registry.max_bytes_for("product.columns")
  end

  def test_a_registered_limit_is_used_when_nothing_configures_the_key
    P.register_preference("product.columns", schema: COLUMNS, max_bytes: 300)

    assert_equal 300, P.registry.max_bytes_for("product.columns")
  end

  def test_the_default_entry_applies_when_neither_names_the_key
    P.register_preference("product.columns", schema: COLUMNS)

    assert_equal 200, P.registry.max_bytes_for("product.columns")
  end

  def test_a_configured_nil_means_unlimited_even_against_a_registered_limit
    P.max_value_bytes = { "default" => 200, "product.columns" => nil }
    P.register_preference("product.columns", schema: COLUMNS, max_bytes: 300)

    assert_nil P.registry.max_bytes_for("product.columns")
  end

  def test_value_within_limit_is_accepted
    P.register_preference("product.columns", schema: COLUMNS)
    assert_equal %w[a b], P.validate("product.columns", %w[a b])
  end

  def test_value_over_limit_raises
    P.register_preference("product.columns", schema: COLUMNS)
    assert_raises(P::PreferenceValueTooLarge) { P.validate("product.columns", ["x" * 300]) }
  end

  def test_error_carries_the_limit_and_the_actual_size
    P.register_preference("product.columns", schema: COLUMNS)
    error = assert_raises(P::PreferenceValueTooLarge) { P.validate("product.columns", ["x" * 300]) }
    assert_equal 200, error.limit
    assert_operator error.actual, :>, 200
  end

  def test_explicit_max_bytes_overrides_the_configured_default
    P.register_preference("product.columns", schema: COLUMNS, max_bytes: 10_000)
    assert_equal ["x" * 300], P.validate("product.columns", ["x" * 300])
  end

  # nil is "not given", not "unlimited" - a size is never nil, so no sentinel is needed.
  def test_max_bytes_nil_falls_back_to_the_configured_default
    P.register_preference("product.columns", schema: COLUMNS, max_bytes: nil)
    assert_raises(P::PreferenceValueTooLarge) { P.validate("product.columns", ["x" * 300]) }
  end

  def test_a_nil_entry_disables_the_limit_for_that_key
    P.max_value_bytes = { "default" => 200, "product.columns" => nil }
    P.register_preference("product.columns", schema: COLUMNS)
    P.register_preference("order.columns", schema: COLUMNS)

    assert_equal ["x" * 10_000], P.validate("product.columns", ["x" * 10_000])
    assert_raises(P::PreferenceValueTooLarge) { P.validate("order.columns", ["x" * 300]) }
  end

  def test_per_key_entry_wins_over_the_default
    P.max_value_bytes = { "default" => 200, "product.columns" => 10_000 }
    P.register_preference("product.columns", schema: COLUMNS)
    P.register_preference("order.columns", schema: COLUMNS)

    assert_equal ["x" * 300], P.validate("product.columns", ["x" * 300])
    assert_raises(P::PreferenceValueTooLarge) { P.validate("order.columns", ["x" * 300]) }
  end

  def test_pattern_key_resolves_the_entry_registered_for_its_pattern
    pattern = %r{[a-zA-Z][a-zA-Z0-9_./-]*\.savedQueries}
    P.max_value_bytes = { "default" => 200, pattern => 10_000 }
    P.register_preference_pattern(pattern, schema: { "type" => "array" })

    big = [{ "label" => "x" * 400 }]
    assert_equal big, P.validate("product.savedQueries", big)
  end

  def test_pattern_entry_can_also_be_keyed_by_the_regexp_source_string
    pattern = %r{[a-zA-Z][a-zA-Z0-9_./-]*\.savedQueries}
    P.max_value_bytes = { "default" => 200, pattern.source => 10_000 }
    P.register_preference_pattern(pattern, schema: { "type" => "array" })

    big = [{ "label" => "x" * 400 }]
    assert_equal big, P.validate("product.savedQueries", big)
  end

  def test_scalar_values_are_measured_too
    P.register_preference("locale", schema: { "type" => "string" })
    assert_equal "cs", P.validate("locale", "cs")
    assert_raises(P::PreferenceValueTooLarge) { P.validate("locale", "x" * 300) }
  end

  def test_nil_default_disables_the_limit_for_every_key
    P.max_value_bytes = { "default" => nil }
    P.register_preference("product.columns", schema: COLUMNS)
    assert_equal ["x" * 10_000], P.validate("product.columns", ["x" * 10_000])
  end

  # Same contract as `defaults`: the config is read when the preference is registered, so changing
  # it afterwards does not move a limit that is already in place.
  def test_the_limit_is_resolved_once_at_registration
    P.max_value_bytes = { "default" => 10_000 }
    P.register_preference("product.columns", schema: COLUMNS)
    P.max_value_bytes = { "default" => 10 }

    assert_equal ["x" * 300], P.validate("product.columns", ["x" * 300])
    assert_equal 10_000, P.max_bytes_for("product.columns")
  end

  # 40 bytes as UTF-8, 56 once non-ASCII is escaped. Pins the measurement against the Python side,
  # where the JSON encoder escapes non-ASCII by default and had to be told not to.
  def test_size_is_the_utf8_wire_size_not_the_ascii_escaped_one
    P.max_value_bytes = { "default" => 41 }
    P.register_preference("product.columns", schema: COLUMNS)
    value = ["Objednávky za poslední čtvrtletí"]

    assert_equal value, P.validate("product.columns", value)
  end

  def test_set_value_does_not_persist_a_value_over_the_limit
    P.register_preference("product.columns", schema: COLUMNS)
    assert_raises(P::PreferenceValueTooLarge) { P.set_value("u1", "product.columns", ["x" * 300]) }
    assert_equal 0, Model.where(user_id: "u1", key: "product.columns").count
  end

  def test_max_bytes_for_exposes_the_resolved_limit
    P.max_value_bytes = { "default" => 200, "product.columns" => 10_000 }
    P.register_preference("product.columns", schema: COLUMNS)
    P.register_preference("order.columns", schema: COLUMNS)

    assert_equal 10_000, P.max_bytes_for("product.columns")
    assert_equal 200, P.max_bytes_for("order.columns")
    assert_raises(P::PreferenceNotRegistered) { P.max_bytes_for("nope.columns") }
  end

  def test_reading_a_stored_value_over_the_limit_does_not_delete_it
    P.register_preference("product.columns", schema: COLUMNS, max_bytes: 10_000)
    P.set_value("u1", "product.columns", ["x" * 300])
    P.registry._clear
    P.register_preference("product.columns", schema: COLUMNS) # now capped at 200

    assert_equal ["x" * 300], P.get_value("u1", "product.columns").value
    assert_equal 1, Model.where(user_id: "u1", key: "product.columns").count
  end
end

# Count guard: `max_keys_per_user` caps how many preference rows one user may hold.
class PreferencesKeyCountLimitTest < Minitest::Test
  P = Habarico::Contrib::Preferences
  Model = Habarico::Contrib::Preferences::UserPreference

  COLUMNS = { "type" => "array", "items" => { "type" => "string" } }.freeze

  def setup
    @original_value_bytes = P.max_value_bytes
    @original_keys = P.max_keys_per_user
    P.registry._clear
    Model.delete_all
    %w[a.columns b.columns c.columns].each { |key| P.register_preference(key, schema: COLUMNS) }
  end

  def teardown
    P.max_value_bytes = @original_value_bytes
    P.max_keys_per_user = @original_keys
  end

  def test_creating_a_key_past_the_limit_raises
    P.max_keys_per_user = 2
    P.set_value("u1", "a.columns", ["x"])
    P.set_value("u1", "b.columns", ["x"])

    assert_raises(P::TooManyPreferences) { P.set_value("u1", "c.columns", ["x"]) }
    assert_equal 2, Model.where(user_id: "u1").count
  end

  def test_overwriting_an_existing_key_at_the_limit_is_allowed
    P.max_keys_per_user = 2
    P.set_value("u1", "a.columns", ["x"])
    P.set_value("u1", "b.columns", ["x"])

    assert_equal ["y"], P.set_value("u1", "a.columns", ["y"]).value
  end

  def test_the_limit_is_counted_per_user
    P.max_keys_per_user = 1
    P.set_value("u1", "a.columns", ["x"])

    assert_equal ["x"], P.set_value("u2", "b.columns", ["x"]).value
  end

  def test_nil_disables_the_count_limit
    P.max_keys_per_user = nil
    %w[a.columns b.columns c.columns].each { |key| P.set_value("u1", key, ["x"]) }

    assert_equal 3, Model.where(user_id: "u1").count
  end
end
