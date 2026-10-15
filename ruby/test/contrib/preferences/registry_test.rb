require "test_helper"
require "habarico/contrib/preferences"

class PreferencesRegistryTest < Minitest::Test
  P = Habarico::Contrib::Preferences

  def setup
    P.registry._clear
  end

  def test_register_and_introspect_exact_key
    P.register_preference("theme", schema: { "enum" => %w[light dark] }, default: "light")
    assert P.registered?("theme")
    assert_equal({ "enum" => %w[light dark] }, P.get_schema("theme"))
    assert_equal "light", P.get_default("theme")
  end

  def test_registered_without_default_returns_nil_default
    P.register_preference("locale", schema: { "type" => "string" })
    assert P.registered?("locale")
    assert_nil P.get_default("locale")
  end

  def test_invalid_key_raises
    assert_raises(P::InvalidPreferenceKey) { P.register_preference("1bad", schema: { "type" => "string" }) }
    assert_raises(P::InvalidPreferenceKey) { P.register_preference("has space", schema: { "type" => "string" }) }
  end

  def test_duplicate_registration_raises
    P.register_preference("theme", schema: { "type" => "string" })
    assert_raises(P::PreferenceAlreadyRegistered) { P.register_preference("theme", schema: { "type" => "string" }) }
  end

  def test_default_validated_at_registration
    assert_raises(P::PreferenceValidationError) do
      P.register_preference("theme", schema: { "enum" => %w[light dark] }, default: "purple")
    end
  end

  def test_callable_default_resolved_and_validated_lazily
    P.register_preference("locale", schema: { "type" => "string" }, default: -> { "cs" })
    assert_equal "cs", P.get_default("locale")
  end

  def test_pattern_key_matches_and_has_no_default
    P.register_preference_pattern(%r{[a-zA-Z][a-zA-Z0-9_./-]*\.columns}, schema: { "type" => "array" })
    assert P.registered?("product.columns")
    assert_equal({ "type" => "array" }, P.get_schema("product.columns"))
    assert_nil P.get_default("product.columns")
  end

  def test_validate_ok_and_error
    P.register_preference("theme", schema: { "enum" => %w[light dark] })
    assert_equal "dark", P.validate("theme", "dark")
    assert_raises(P::PreferenceValidationError) { P.validate("theme", "nope") }
  end

  def test_unregistered_lookups_raise
    assert_raises(P::PreferenceNotRegistered) { P.get_schema("missing") }
    assert_raises(P::PreferenceNotRegistered) { P.validate("missing", 1) }
    refute P.registered?("missing")
  end
end
