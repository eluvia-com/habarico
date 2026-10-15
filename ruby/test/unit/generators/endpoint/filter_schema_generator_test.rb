require 'test_helper'

class FilterSchemaGeneratorTestEmployee
  def self.i18n_scope
    :activerecord
  end

  def self.model_name
    Struct.new(:i18n_key).new('filter_schema_generator_test_employee')
  end

  # Mirrors the real-world Habarico pattern where the model class used for filtering
  # (`Eluvia::ActiveRecord::FiltersModel`) is a nested `::Filters` proxy with its own
  # (unrelated) i18n_scope/model_name, distinct from the real AR model's.
  class Filters
    def self.i18n_scope
      :activemodel
    end

    def self.model_name
      Struct.new(:i18n_key).new('filter_schema_generator_test_employee/filters')
    end
  end
end

class FilterSchemaGeneratorTest < Minitest::Test

  def setup
    I18n.backend.reload!
  end

  def teardown
    I18n.backend.reload!
  end

  def stub_filters_model(i18n_scope: :activerecord, model_key: 'thing')
    model = Object.new
    model.define_singleton_method(:i18n_scope) { i18n_scope }
    model.define_singleton_method(:model_name) { Struct.new(:i18n_key).new(model_key) }
    model
  end

  def build_generator
    definition = Object.new
    Habarico::FilterSchemaGenerator.new(definition, ['resource'])
  end

  def filter_param(overrides = {})
    { attr_name: :status, model: stub_filters_model, label: nil }.merge(overrides)
  end

  def test_generate_label_returns_explicit_label_when_present
    generator = build_generator
    result = generator.send(:generate_label, nil, :status, filter_param(label: 'Custom Label'))
    assert_equal 'Custom Label', result
  end

  def test_generate_label_prefers_explicit_label_over_i18n
    I18n.backend.store_translations(:en, activerecord: { attributes: { thing: { status: 'Current state (i18n)' } } })
    generator = build_generator
    result = generator.send(:generate_label, nil, :status, filter_param(label: 'Custom Label'))
    assert_equal 'Custom Label', result
  end

  def test_generate_label_uses_i18n_translation_when_no_explicit_label
    I18n.backend.store_translations(:en, activerecord: { attributes: { thing: { status: 'Current state' } } })
    generator = build_generator
    result = generator.send(:generate_label, nil, :status, filter_param(label: nil))
    assert_equal 'Current state', result
  end

  def test_generate_label_falls_back_to_humanize_when_no_label_and_no_i18n
    generator = build_generator
    result = generator.send(:generate_label, nil, :status, filter_param(label: nil))
    assert_equal 'Status', result
  end

  def test_generate_label_falls_back_to_humanize_when_label_blank_string
    generator = build_generator
    result = generator.send(:generate_label, nil, :status, filter_param(label: ''))
    assert_equal 'Status', result
  end

  def test_generate_label_resolves_i18n_through_nested_filters_proxy_class
    I18n.backend.store_translations(:en, activerecord: { attributes: { filter_schema_generator_test_employee: { status: 'Current state' } } })
    generator = build_generator
    result = generator.send(:generate_label, nil, :status, filter_param(model: FilterSchemaGeneratorTestEmployee::Filters, label: nil))
    assert_equal 'Current state', result
  end

end
