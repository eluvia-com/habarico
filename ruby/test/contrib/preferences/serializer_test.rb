require "test_helper"
require "habarico/contrib/preferences"

class PreferencesSerializerTest < Minitest::Test
  P = Habarico::Contrib::Preferences

  def test_item_shape_with_timestamp
    at = Time.utc(2026, 5, 25, 13, 42, 0)
    resolved = P::ResolvedPreference.new(key: "theme", value: "dark", updated_at: at)
    item = P::Serializer.item(resolved)
    assert_equal "theme", item["key"]
    assert_equal "dark", item["value"]
    assert_equal at.iso8601, item["updated_at"]
  end

  def test_item_shape_with_nil_timestamp
    resolved = P::ResolvedPreference.new(key: "locale", value: "cs", updated_at: nil)
    item = P::Serializer.item(resolved)
    assert_nil item["updated_at"]
  end
end
