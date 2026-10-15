require 'test_helper'

class FilterDescriptorGeneratorTestEmployee
  def self.i18n_scope
    :activerecord
  end

  def self.model_name
    Struct.new(:i18n_key).new('filter_descriptor_generator_test_employee')
  end

  # Mirrors the real-world Habarico pattern where the model class used for filtering
  # (`Eluvia::ActiveRecord::FiltersModel`) is a nested `::Filters` proxy with its own
  # (unrelated) i18n_scope/model_name, distinct from the real AR model's.
  class Filters
    def self.i18n_scope
      :activemodel
    end

    def self.model_name
      Struct.new(:i18n_key).new('filter_descriptor_generator_test_employee/filters')
    end
  end
end

class FilterDescriptorGeneratorTest < Minitest::Test

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

  def stub_model(filter_params = {})
    model = Object.new
    model.define_singleton_method(:filter_params) { filter_params }
    model
  end

  def build_generator
    definition = Object.new
    Habarico::FilterDescriptorGenerator.new(definition, ['resource'])
  end

  def filter_ref(attrs = {})
    ref = Habarico::FilterReference.new
    ref.name = attrs.fetch(:name, 'status')
    ref.label = attrs[:label]
    ref
  end

  def test_generate_label_returns_explicit_label_when_present
    generator = build_generator
    model = stub_model
    ref = filter_ref(label: 'Custom Label')
    result = generator.send(:generate_label, model, ref, nil)
    assert_equal 'Custom Label', result
  end

  def test_generate_label_prefers_explicit_label_over_i18n
    I18n.backend.store_translations(:en, activerecord: { attributes: { thing: { status: 'Current state (i18n)' } } })
    model = stub_model(status: { attr_name: :status, model: stub_filters_model })
    ref = filter_ref(label: 'Custom Label')
    generator = build_generator
    result = generator.send(:generate_label, model, ref, nil)
    assert_equal 'Custom Label', result
  end

  def test_generate_label_uses_i18n_translation_when_filter_param_found
    I18n.backend.store_translations(:en, activerecord: { attributes: { thing: { status: 'Current state' } } })
    model = stub_model(status: { attr_name: :status, model: stub_filters_model })
    ref = filter_ref(label: nil)
    generator = build_generator
    result = generator.send(:generate_label, model, ref, nil)
    assert_equal 'Current state', result
  end

  def test_generate_label_returns_nil_when_no_explicit_label_and_no_i18n_translation
    model = stub_model(status: { attr_name: :status, model: stub_filters_model })
    ref = filter_ref(label: nil)
    generator = build_generator
    result = generator.send(:generate_label, model, ref, nil)
    assert_nil result
  end

  def test_generate_label_returns_nil_when_filter_param_not_found
    model = stub_model({})
    ref = filter_ref(name: 'unknown', label: nil)
    generator = build_generator
    result = generator.send(:generate_label, model, ref, nil)
    assert_nil result
  end

  def test_generate_label_returns_nil_when_model_does_not_respond_to_filter_params
    model = Object.new
    ref = filter_ref(label: nil)
    generator = build_generator
    result = generator.send(:generate_label, model, ref, nil)
    assert_nil result
  end

  def test_generate_label_resolves_i18n_through_nested_filters_proxy_class
    I18n.backend.store_translations(:en, activerecord: { attributes: { filter_descriptor_generator_test_employee: { status: 'Current state' } } })
    model = stub_model(status: { attr_name: :status, model: FilterDescriptorGeneratorTestEmployee::Filters })
    ref = filter_ref(label: nil)
    generator = build_generator
    result = generator.send(:generate_label, model, ref, nil)
    assert_equal 'Current state', result
  end

end
