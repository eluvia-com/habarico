require 'test_helper'

class GalleryBoxParametersGeneratorTest < Minitest::Test

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model
  end

  def stub_context
    ctx = Object.new
    ctx.define_singleton_method(:can?) { |_permission| true }
    ctx
  end

  def build_definition
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.label = 'Things'
    definition.views = []
    definition.actions = []
    definition
  end

  def build_generator
    Habarico::GalleryBoxParametersGenerator.new(build_definition, ['things'])
  end

  def build_box(reference: 'images', image_field: 'photo', **opts)
    Habarico::GalleryBox.new(reference: reference, image_field: image_field, **opts)
  end

  # ---------------------------------------------------------------------------
  # GalleryBox definition
  # ---------------------------------------------------------------------------

  def test_gallery_box_type_is_gallery
    box = Habarico::GalleryBox.new
    assert_equal 'gallery', box.type
  end

  def test_gallery_box_accepts_reference
    box = Habarico::GalleryBox.new(reference: 'images')
    assert_equal 'images', box.reference
  end

  def test_gallery_box_accepts_image_field
    box = Habarico::GalleryBox.new(image_field: 'photo')
    assert_equal 'photo', box.image_field
  end

  def test_gallery_box_accepts_target
    box = Habarico::GalleryBox.new(target: 'article_id')
    assert_equal 'article_id', box.target
  end

  def test_gallery_box_target_defaults_to_nil
    box = Habarico::GalleryBox.new
    assert_nil box.target
  end

  def test_gallery_box_accepts_extra_filters
    box = Habarico::GalleryBox.new(extra_filters: { status: 'active' })
    assert_equal({ status: 'active' }, box.extra_filters)
  end

  def test_gallery_box_extra_filters_defaults_to_nil
    box = Habarico::GalleryBox.new
    assert_nil box.extra_filters
  end

  def test_gallery_box_accepts_schema_params
    box = Habarico::GalleryBox.new(schema_params: { mode: 'full' })
    assert_equal({ mode: 'full' }, box.schema_params)
  end

  def test_gallery_box_schema_params_defaults_to_nil
    box = Habarico::GalleryBox.new
    assert_nil box.schema_params
  end

  def test_gallery_box_accepts_default_sorting
    box = Habarico::GalleryBox.new(default_sorting: 'created_at:asc')
    assert_equal 'created_at:asc', box.default_sorting
  end

  def test_gallery_box_default_sorting_defaults_to_nil
    box = Habarico::GalleryBox.new
    assert_nil box.default_sorting
  end

  # ---------------------------------------------------------------------------
  # Generator — private method generate_reference
  # ---------------------------------------------------------------------------

  def test_generate_reference_addresses_the_box_resource
    generator = build_generator
    box = Habarico::GalleryBox.new(reference: 'photos')
    reference = generator.send(:generate_reference, box, stub_context)
    assert_nil reference.service
    assert_equal 'photos', reference.resource
  end

  def test_generate_reference_splits_a_prefixed_name
    generator = build_generator
    box = Habarico::GalleryBox.new(reference: 'eshop/photos')
    reference = generator.send(:generate_reference, box, stub_context)
    assert_equal 'eshop', reference.service
    assert_equal 'photos', reference.resource
  end

  def test_generate_reference_returns_nil_when_not_set
    generator = build_generator
    box = Habarico::GalleryBox.new
    assert_nil generator.send(:generate_reference, box, stub_context)
  end

  # ---------------------------------------------------------------------------
  # Generator — private method generate_image_field
  # ---------------------------------------------------------------------------

  def test_generate_image_field_returns_box_image_field
    generator = build_generator
    box = Habarico::GalleryBox.new(image_field: 'thumbnail')
    assert_equal 'thumbnail', generator.send(:generate_image_field, box, stub_context)
  end

  def test_generate_image_field_returns_nil_when_not_set
    generator = build_generator
    box = Habarico::GalleryBox.new
    assert_nil generator.send(:generate_image_field, box, stub_context)
  end

  # ---------------------------------------------------------------------------
  # Generator — private method generate_target
  # ---------------------------------------------------------------------------

  def test_generate_target_returns_box_target
    generator = build_generator
    box = Habarico::GalleryBox.new(target: 'article_id')
    assert_equal 'article_id', generator.send(:generate_target, box, stub_context)
  end

  def test_generate_target_returns_nil_when_not_set
    generator = build_generator
    box = Habarico::GalleryBox.new
    assert_nil generator.send(:generate_target, box, stub_context)
  end

  # ---------------------------------------------------------------------------
  # Generator — private method generate_label
  # ---------------------------------------------------------------------------

  def test_generate_label_returns_box_label
    generator = build_generator
    box = Habarico::GalleryBox.new(label: 'My Gallery')
    assert_equal 'My Gallery', generator.send(:generate_label, box, stub_context)
  end

  def test_generate_label_returns_nil_when_not_set
    generator = build_generator
    box = Habarico::GalleryBox.new
    assert_nil generator.send(:generate_label, box, stub_context)
  end

  # ---------------------------------------------------------------------------
  # Generator — the query the box's schema request carries
  # ---------------------------------------------------------------------------

  def test_schema_params_travel_inside_the_reference
    generator = build_generator
    box = Habarico::GalleryBox.new(reference: 'photos', schema_params: { mode: 'compact' })
    assert_equal({ mode: 'compact' }, generator.send(:generate_reference, box, stub_context).params)
  end

  def test_a_reference_without_a_query_carries_none
    generator = build_generator
    box = Habarico::GalleryBox.new(reference: 'photos')
    assert_nil generator.send(:generate_reference, box, stub_context).params
  end

  # ---------------------------------------------------------------------------
  # Generator — private method generate_extra_filters
  # ---------------------------------------------------------------------------

  def test_generate_extra_filters_returns_static_hash
    generator = build_generator
    box = Habarico::GalleryBox.new(extra_filters: { status: 'active' })
    assert_equal({ status: 'active' }, generator.send(:generate_extra_filters, box, stub_context))
  end

  def test_generate_extra_filters_returns_nil_when_not_set
    generator = build_generator
    box = Habarico::GalleryBox.new
    assert_nil generator.send(:generate_extra_filters, box, stub_context)
  end

  # ---------------------------------------------------------------------------
  # Generator — private method generate_filters
  # ---------------------------------------------------------------------------

  def test_generate_filters_returns_empty_array_when_no_filters
    generator = build_generator
    box = build_box
    result = generator.send(:generate_filters, box, stub_context)
    assert_equal [], result
  end

  def test_generate_filters_returns_filter_descriptors
    generator = build_generator
    filter_ref = Habarico::FilterReference.new(name: 'status')
    box = Habarico::GalleryBox.new(reference: 'images', image_field: 'photo', filters: [filter_ref])
    result = generator.send(:generate_filters, box, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::FilterDescriptor, result.first
    assert_equal 'status', result.first.name
  end

  def test_generate_filters_returns_multiple_filter_descriptors
    generator = build_generator
    filters = [
      Habarico::FilterReference.new(name: 'status'),
      Habarico::FilterReference.new(name: 'category'),
    ]
    box = Habarico::GalleryBox.new(reference: 'images', image_field: 'photo', filters: filters)
    result = generator.send(:generate_filters, box, stub_context)
    assert_equal 2, result.size
    assert_equal 'status', result[0].name
    assert_equal 'category', result[1].name
  end

  # ---------------------------------------------------------------------------
  # Generator — private method generate_default_sorting
  # ---------------------------------------------------------------------------

  def test_generate_default_sorting_returns_sort_descriptor
    generator = build_generator
    box = Habarico::GalleryBox.new(default_sorting: 'created_at:asc')
    result = generator.send(:generate_default_sorting, box, stub_context)
    assert_instance_of Habarico::SortDescriptor, result
    assert_equal 'created_at', result.field_name
    assert_equal 'asc', result.direction
  end

  def test_generate_default_sorting_with_desc_direction
    generator = build_generator
    box = Habarico::GalleryBox.new(default_sorting: 'uploaded_at:desc')
    result = generator.send(:generate_default_sorting, box, stub_context)
    assert_equal 'uploaded_at', result.field_name
    assert_equal 'desc', result.direction
  end

  # ---------------------------------------------------------------------------
  # Generator — raises on invalid input
  # ---------------------------------------------------------------------------

  def test_generate_raises_for_non_gallery_box
    generator = build_generator
    list_box = Habarico::ListBox.new(reference: 'images', target: 'article_id')
    assert_raises(Eluvia::Errors::StandardError) do
      generator.generate(list_box, stub_context)
    end
  end

  def test_generate_raises_for_plain_box
    generator = build_generator
    plain_box = Habarico::Box.new
    assert_raises(Eluvia::Errors::StandardError) do
      generator.generate(plain_box, stub_context)
    end
  end

  # ---------------------------------------------------------------------------
  # Generator — full generate output
  # ---------------------------------------------------------------------------

  def test_generate_returns_gallery_box_parameters
    generator = build_generator
    result = generator.generate(build_box, stub_context)
    assert_instance_of Habarico::GalleryBoxParameters, result
  end

  def test_generate_sets_reference
    generator = build_generator
    result = generator.generate(build_box(reference: 'photos'), stub_context)
    assert_equal 'photos', result.reference.resource
  end

  def test_generate_sets_image_field
    generator = build_generator
    result = generator.generate(build_box(image_field: 'thumbnail'), stub_context)
    assert_equal 'thumbnail', result.image_field
  end

  def test_generate_sets_target
    generator = build_generator
    result = generator.generate(build_box(target: 'article_id'), stub_context)
    assert_equal 'article_id', result.target
  end

  def test_generate_sets_target_to_nil_when_not_provided
    generator = build_generator
    result = generator.generate(build_box, stub_context)
    assert_nil result.target
  end

  def test_generate_sets_label
    generator = build_generator
    result = generator.generate(build_box(label: 'Images'), stub_context)
    assert_equal 'Images', result.label
  end

  def test_generate_sets_extra_filters
    generator = build_generator
    result = generator.generate(build_box(extra_filters: { published: true }), stub_context)
    assert_equal({ published: true }, result.extra_filters)
  end

  def test_generate_carries_the_query_inside_the_reference
    generator = build_generator
    result = generator.generate(build_box(schema_params: { view: 'grid' }), stub_context)
    assert_equal({ view: 'grid' }, result.reference.params)
  end

  def test_generate_sets_default_sorting
    generator = build_generator
    result = generator.generate(build_box(default_sorting: 'created_at:asc'), stub_context)
    assert_instance_of Habarico::SortDescriptor, result.default_sorting
    assert_equal 'created_at', result.default_sorting.field_name
  end

  def test_generate_filters_are_empty_by_default
    generator = build_generator
    result = generator.generate(build_box, stub_context)
    assert_equal [], result.filters
  end

end
