require 'test_helper'

# Verifies that every translation key under `habarico.*` (config/locales) resolves via I18n.t for
# all 13 supported locales. Catches missing keys/files introduced when adding a new language or a
# new translatable string.
#
# The change-history translations moved to habarico-enterprise with the feature itself (HAB-812)
# and are covered by that gem's own locales test.
class LocalesTest < Minitest::Test

  LOCALES = %w[cs en de es fr it ja nl pl pt ro sk uk].freeze

  CONFIG_KEYS = %w[
    actions.common.show
    actions.common.create
    actions.common.edit
    actions.common.delete
    actions.common.save
    confirmations.common.delete.title
    confirmations.common.delete.message
    filters.common.search
    search.yes
    search.no
    habarico.errors.order_by.unknown_field
    habarico.errors.filter.unknown_term
  ].freeze

  def self.startup
    I18n.load_path |= Dir[File.expand_path('../../config/locales/*.yml', __dir__)]
    I18n.backend.reload!
  end
  startup

  CONFIG_KEYS.each do |key|
    LOCALES.each do |locale|
      define_method("test_#{locale}_translates_#{key.tr('./', '__')}") do
        value = I18n.t(key, locale: locale, raise: true)
        refute_empty value, "#{key} (#{locale}) resolved to an empty string"
      end
    end
  end
end
