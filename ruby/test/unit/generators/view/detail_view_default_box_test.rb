require 'test_helper'

# A show, create or edit view that lays out nothing shows the resource's fields, the way the list
# does; a view that declares its layout keeps it.
class DetailViewDefaultBoxTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model.define_singleton_method(:model_name) { ActiveModel::Name.new(model, nil, 'Product') }
    model.define_singleton_method(:i18n_scope) { :activerecord }
    model.define_singleton_method(:columns_hash) { {} }
    model.define_singleton_method(:reflect_on_association) { |_| nil }
    model
  end

  def context
    context = Habarico::Context.new
    context.define_singleton_method(:can?) { |_permission| true }
    context
  end

  def definition
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.fields = [:id, :name, Habarico::FieldReference.new(name: :price_major, label: 'Price'), :created_at]
    definition.read_only_fields = %i[id created_at sold_count]
    definition.write_only_fields = [:internal_note]
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    definition
  end

  def box_of(view)
    Habarico::DetailViewParametersGenerator.new(definition, ['products']).generate(view, context).box
  end

  def field_names(box)
    box.boxes.map(&:name)
  end

  def test_a_show_view_shows_the_readable_fields
    assert_equal %w[id name price_major created_at sold_count], field_names(box_of(Habarico::ShowView.new))
  end

  def test_a_form_also_takes_the_write_only_fields
    expected = %w[id name price_major created_at sold_count internal_note]

    assert_equal expected, field_names(box_of(Habarico::EditView.new))
    assert_equal expected, field_names(box_of(Habarico::CreateView.new))
  end

  def test_a_field_reference_keeps_its_label
    price = box_of(Habarico::ShowView.new).boxes.find { |field| field.name == 'price_major' }

    assert_equal 'Price', price.label
  end

  def test_a_field_with_subfields_is_laid_out_by_its_name
    with_subfields = definition
    with_subfields.read_only_fields = [:id, { address: %i[street city] }]
    box = Habarico::DetailViewParametersGenerator.new(with_subfields, ['products']).generate(Habarico::ShowView.new, context).box

    assert_equal %w[id name price_major created_at address], field_names(box)
  end

  def test_declared_boxes_are_kept
    assert_equal %w[name], field_names(box_of(Habarico::ShowView.new(boxes: [:name])))
  end

  def test_a_declared_box_is_kept
    box = box_of(Habarico::ShowView.new(box: Habarico::Box.new(label: 'Summary', boxes: [:name])))

    assert_equal 'Summary', box.label
    assert_equal %w[name], field_names(box)
  end

  def test_an_action_view_gets_no_default
    view = Habarico::ActionView.new(name: 'refund', is_detail: true)

    assert_nil box_of(view).boxes
  end
end
