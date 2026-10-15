require 'test_helper'

class GlobalViewSchemaTest < Minitest::Test

  # ---------------------------------------------------------------------------
  # mode
  # ---------------------------------------------------------------------------

  def test_mode_defaults_to_nil
    schema = Habarico::GlobalViewSchema.new(name: 'list', type: 'list', is_detail: false)
    assert_nil schema.mode
  end

  def test_mode_accepts_redirect
    schema = Habarico::GlobalViewSchema.new(name: 'show', type: 'show', mode: 'redirect')
    assert_equal 'redirect', schema.mode
  end

  def test_mode_accepts_sidepanel
    schema = Habarico::GlobalViewSchema.new(name: 'show', type: 'show', mode: 'sidepanel')
    assert_equal 'sidepanel', schema.mode
  end

  def test_existing_attributes_still_work
    schema = Habarico::GlobalViewSchema.new(name: 'edit', type: 'edit', is_detail: true)
    assert_equal 'edit', schema.name
    assert_equal 'edit', schema.type
    assert_equal true, schema.is_detail
  end

end
