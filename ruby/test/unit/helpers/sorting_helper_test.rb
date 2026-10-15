require "test_helper"

# HAB-915 - the single definition of what a resource offers for sorting, read by the two schema
# generators and by the `order_by` validator. These pin the `sort_by` the generators publish, which
# the refactoring had to leave untouched.
class SortingHelperTest < Minitest::Test

  def build_model(columns: %w[id name valid_from valid_to], range_attrs: {}, associations: {})
    model = Class.new(ActiveRecord::Base)
    model.define_singleton_method(:name) { 'Product' }
    model.define_singleton_method(:columns_hash) { columns.index_with { |_column| Object.new } }
    model.define_singleton_method(:attribute_names) { columns }
    model.define_singleton_method(:reflect_on_association) { |name| associations[name.to_sym] }

    unless range_attrs.empty?
      model.define_singleton_method(:has_range_attr?) { |attr_name| range_attrs.key?(attr_name.to_s) }
      model.define_singleton_method(:find_range_attr) { |attr_name| range_attrs[attr_name.to_s] }
    end

    model
  end

  def association_to(model)
    reflection = Object.new
    reflection.define_singleton_method(:klass) { model }
    reflection
  end

  def build_definition(model, sorting_fields: [])
    definition = Habarico::Definition.new
    definition.model = model
    definition.sorting_fields = sorting_fields
    definition
  end

  def field_reference(name:, sort_by: nil)
    Habarico::FieldReference.new(name: name, sort_by: sort_by)
  end

  # ***************************************************************************
  # schema_sort_by - the `sort_by` of a resource field
  # ***************************************************************************

  def test_a_column_sorts_under_its_own_name
    model = build_model
    assert_equal 'name', Habarico::SortingHelper.schema_sort_by(build_definition(model), model, 'name')
  end

  def test_a_range_field_sorts_by_its_lower_bound
    model = build_model(range_attrs: { 'validity' => { lower_attr_name: :valid_from } })
    assert_equal :valid_from, Habarico::SortingHelper.schema_sort_by(build_definition(model), model, 'validity')
  end

  def test_a_field_backed_by_nothing_sortable_has_no_sort_by
    model = build_model
    assert_nil Habarico::SortingHelper.schema_sort_by(build_definition(model), model, 'representation')
  end

  def test_sorting_fields_decides_on_its_own
    model = build_model
    definition = build_definition(model, sorting_fields: %i[valid_from])

    assert_equal 'valid_from', Habarico::SortingHelper.schema_sort_by(definition, model, 'valid_from')
    assert_nil Habarico::SortingHelper.schema_sort_by(definition, model, 'name')
  end

  def test_a_model_without_reflection_has_nothing_to_sort_by
    model = Class.new
    assert_nil Habarico::SortingHelper.schema_sort_by(build_definition(model), model, 'name')
  end

  # ***************************************************************************
  # descriptor_sort_by - the `sort_by` of a field of a view
  # ***************************************************************************

  def test_a_column_of_an_association_sorts_under_the_name_it_is_declared_with
    model = build_model(associations: { author: association_to(build_model(columns: %w[id name])) })

    assert_equal 'author__name',
      Habarico::SortingHelper.descriptor_sort_by(model, field_reference(name: 'author__name'))
  end

  def test_a_name_no_association_backs_falls_through_to_the_declaration
    model = build_model

    assert_nil Habarico::SortingHelper.descriptor_sort_by(model, field_reference(name: 'author__name'))
    assert_equal 'name',
      Habarico::SortingHelper.descriptor_sort_by(model, field_reference(name: 'author__name', sort_by: 'name'))
  end

  def test_a_declared_sort_by_is_taken_as_it_is
    model = build_model

    assert_equal 'products.name',
      Habarico::SortingHelper.descriptor_sort_by(model, field_reference(name: 'product', sort_by: 'products.name'))
  end

end
