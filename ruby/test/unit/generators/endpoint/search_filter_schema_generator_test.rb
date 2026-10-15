require 'test_helper'

class SearchFilterSchemaGeneratorTest < Minitest::Test

  def build_generator
    definition = Object.new
    Habarico::SearchFilterSchemaGenerator.new(definition, ['resource'])
  end

  def stub_model(i18n_scope: :activerecord, model_key: 'thing')
    model = Object.new
    model.define_singleton_method(:i18n_scope) { i18n_scope }
    model.define_singleton_method(:model_name) { Struct.new(:i18n_key).new(model_key) }
    model
  end

  def test_generate_sets_search_format_so_the_frontend_renders_a_search_input
    schema = build_generator.generate(stub_model)
    assert_equal 'search', schema.format
  end

  def test_generate_sets_search_name_and_string_type
    schema = build_generator.generate(stub_model)
    assert_equal 'search', schema.name
    assert_equal 'string', schema.type
  end

end
