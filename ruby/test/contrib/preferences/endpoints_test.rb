require_relative "preferences_helper"

class PreferencesEndpointsTest < ActionDispatch::IntegrationTest
  P = Habarico::Contrib::Preferences

  def app
    PreferencesTestApp.build!
    Rails.application
  end

  def setup
    PreferencesTestApp.build!
    P.registry._clear
    P::UserPreference.delete_all
    P.register_preference("theme", schema: { "enum" => %w[light dark] }, default: "light")
    P.register_preference("locale", schema: { "type" => "string" })
  end

  def test_list_returns_registered_defaults
    get "/user-preferences"
    assert_equal 200, response.status
    body = JSON.parse(response.body)
    theme = body.find { |i| i["key"] == "theme" }
    assert_equal "light", theme["value"]
    assert_nil theme["updated_at"]
    refute(body.any? { |i| i["key"] == "locale" }) # no value + no default => omitted
  end

  def test_put_then_get_key
    put "/user-preferences/theme", params: "\"dark\"", headers: { "CONTENT_TYPE" => "application/json" }
    assert_equal 200, response.status
    assert_equal "dark", JSON.parse(response.body)["value"]

    get "/user-preferences/theme"
    assert_equal 200, response.status
    assert_equal "dark", JSON.parse(response.body)["value"]
  end

  def test_put_invalid_value_is_422
    put "/user-preferences/theme", params: "\"purple\"", headers: { "CONTENT_TYPE" => "application/json" }
    assert_equal 422, response.status
  end

  def test_unregistered_key_is_404
    get "/user-preferences/missing"
    assert_equal 404, response.status
    put "/user-preferences/missing", params: "\"x\"", headers: { "CONTENT_TYPE" => "application/json" }
    assert_equal 404, response.status
  end

  def test_get_unset_no_default_is_404
    get "/user-preferences/locale"
    assert_equal 404, response.status
  end

  def test_delete_key_and_delete_all
    put "/user-preferences/theme", params: "\"dark\"", headers: { "CONTENT_TYPE" => "application/json" }
    delete "/user-preferences/theme"
    assert_equal 204, response.status
    get "/user-preferences/theme"
    assert_equal "light", JSON.parse(response.body)["value"]

    put "/user-preferences/theme", params: "\"dark\"", headers: { "CONTENT_TYPE" => "application/json" }
    delete "/user-preferences"
    assert_equal 204, response.status
    assert_equal 0, P::UserPreference.count
  end

  def test_key_with_dots_roundtrips
    P.register_preference("preferences.layout.app.stripedRows", schema: { "type" => "boolean" }, default: false)
    put "/user-preferences/preferences.layout.app.stripedRows",
        params: "true", headers: { "CONTENT_TYPE" => "application/json" }
    assert_equal 200, response.status
    get "/user-preferences/preferences.layout.app.stripedRows"
    assert_equal true, JSON.parse(response.body)["value"]
  end
end

# The size and count guards over HTTP: both are 422, the same envelope a schema mismatch gets.
class PreferencesLimitEndpointsTest < ActionDispatch::IntegrationTest
  P = Habarico::Contrib::Preferences

  JSON_HEADERS = { "CONTENT_TYPE" => "application/json" }.freeze
  COLUMNS = { "type" => "array", "items" => { "type" => "string" } }.freeze

  def app
    PreferencesTestApp.build!
    Rails.application
  end

  def setup
    PreferencesTestApp.build!
    @original_value_bytes = P.max_value_bytes
    @original_keys = P.max_keys_per_user
    P.registry._clear
    P::UserPreference.delete_all
  end

  def teardown
    P.max_value_bytes = @original_value_bytes
    P.max_keys_per_user = @original_keys
  end

  def test_put_value_over_the_limit_is_422_and_stores_nothing
    P.max_value_bytes = { "default" => 200 }
    P.register_preference("product.columns", schema: COLUMNS)

    put "/user-preferences/product.columns", params: JSON.generate(["x" * 300]), headers: JSON_HEADERS

    assert_equal 422, response.status
    assert_equal 0, P::UserPreference.where(key: "product.columns").count
  end

  def test_put_value_within_the_limit_is_stored
    P.max_value_bytes = { "default" => 200 }
    P.register_preference("product.columns", schema: COLUMNS)

    put "/user-preferences/product.columns", params: JSON.generate(%w[a b]), headers: JSON_HEADERS

    assert_equal 200, response.status
    assert_equal %w[a b], JSON.parse(response.body)["value"]
  end

  def test_put_new_key_past_the_count_limit_is_422
    P.max_keys_per_user = 1
    P.register_preference("a.columns", schema: COLUMNS)
    P.register_preference("b.columns", schema: COLUMNS)
    put "/user-preferences/a.columns", params: JSON.generate(%w[x]), headers: JSON_HEADERS

    put "/user-preferences/b.columns", params: JSON.generate(%w[x]), headers: JSON_HEADERS

    assert_equal 422, response.status
    assert_equal 1, P::UserPreference.count
  end

  def test_put_existing_key_at_the_count_limit_still_succeeds
    P.max_keys_per_user = 1
    P.register_preference("a.columns", schema: COLUMNS)
    put "/user-preferences/a.columns", params: JSON.generate(%w[x]), headers: JSON_HEADERS

    put "/user-preferences/a.columns", params: JSON.generate(%w[y]), headers: JSON_HEADERS

    assert_equal 200, response.status
    assert_equal %w[y], JSON.parse(response.body)["value"]
  end

  def test_oversized_body_for_an_unregistered_key_is_still_404
    P.max_value_bytes = { "default" => 200 }

    put "/user-preferences/nope.columns", params: JSON.generate(["x" * 300]), headers: JSON_HEADERS

    assert_equal 404, response.status
  end
end
