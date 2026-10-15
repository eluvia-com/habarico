require "test_helper"
require "habarico/contrib/preferences"

class BasePreferencesTest < Minitest::Test
  P = Habarico::Contrib::Preferences

  def setup
    P.registry._clear
    P.defaults = {}
  end

  def test_all_base_exact_keys_registered
    P.register_base_preferences
    %w[
      theme locale preferences.dashboard
      preferences.layout.app.pageWidth preferences.layout.app.contrastMode
      preferences.layout.app.stripedRows preferences.layout.app.density
    ].each { |key| assert P.registered?(key), "#{key} not registered" }
  end

  def test_pattern_keys_registered
    P.register_base_preferences
    assert P.registered?("product.savedQueries")
    assert P.registered?("product.columns")
    assert P.registered?("product.columnWidths")
  end

  def test_base_keys_have_no_default_without_config
    P.register_base_preferences
    assert_nil P.get_default("theme")
  end

  def test_default_applied_from_config
    P.defaults = { "theme" => "light" }
    P.register_base_preferences
    assert_equal "light", P.get_default("theme")
  end

  def test_theme_schema_validates_expected_values
    P.register_base_preferences
    assert_equal "dark", P.validate("theme", "dark")
    assert_raises(P::PreferenceValidationError) { P.validate("theme", "purple") }
  end

  def test_density_schema_validates_expected_values
    P.register_base_preferences
    key = "preferences.layout.app.density"
    %w[compact standard comfortable].each { |value| assert_equal value, P.validate(key, value) }
    # `normal` was renamed to `standard` in node 6.7.0 so the value can be passed straight to the
    # table components; the contract enum follows it (HAB-939).
    assert_raises(P::PreferenceValidationError) { P.validate(key, "normal") }
  end

  def test_dashboard_schema_accepts_widget_and_rejects_bad_widget
    P.register_base_preferences
    ok = { "widgets" => [{ "id" => "w1", "type" => "chart", "layout" => { "x" => 0, "y" => 0, "w" => 2, "h" => 2 } }] }
    assert P.validate("preferences.dashboard", ok)
    bad = { "widgets" => [{ "type" => "chart" }] } # missing id + layout
    assert_raises(P::PreferenceValidationError) { P.validate("preferences.dashboard", bad) }
  end
end
