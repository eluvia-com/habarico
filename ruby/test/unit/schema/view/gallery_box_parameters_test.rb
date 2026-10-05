require 'test_helper'

class GalleryBoxParametersTest < Minitest::Test

  # ---------------------------------------------------------------------------
  # reference
  # ---------------------------------------------------------------------------

  def test_reference_is_set
    params = Habarico::GalleryBoxParameters.new(reference: Habarico::ResourceReference.build('images'))
    assert_equal 'images', params.reference.resource
  end

  def test_reference_defaults_to_nil
    params = Habarico::GalleryBoxParameters.new
    assert_nil params.reference
  end

  # ---------------------------------------------------------------------------
  # image_field
  # ---------------------------------------------------------------------------

  def test_image_field_is_set
    params = Habarico::GalleryBoxParameters.new(image_field: 'photo')
    assert_equal 'photo', params.image_field
  end

  def test_image_field_defaults_to_nil
    params = Habarico::GalleryBoxParameters.new
    assert_nil params.image_field
  end

  # ---------------------------------------------------------------------------
  # target
  # ---------------------------------------------------------------------------

  def test_target_is_set
    params = Habarico::GalleryBoxParameters.new(target: 'article_id')
    assert_equal 'article_id', params.target
  end

  def test_target_defaults_to_nil
    params = Habarico::GalleryBoxParameters.new
    assert_nil params.target
  end

  # ---------------------------------------------------------------------------
  # label
  # ---------------------------------------------------------------------------

  def test_label_is_set
    params = Habarico::GalleryBoxParameters.new(label: 'Gallery')
    assert_equal 'Gallery', params.label
  end

  def test_label_defaults_to_nil
    params = Habarico::GalleryBoxParameters.new
    assert_nil params.label
  end

  # ---------------------------------------------------------------------------
  # extra_filters
  # ---------------------------------------------------------------------------

  def test_extra_filters_is_set
    params = Habarico::GalleryBoxParameters.new(extra_filters: { article_id: 1 })
    assert_equal({ article_id: 1 }, params.extra_filters)
  end

  def test_extra_filters_defaults_to_nil
    params = Habarico::GalleryBoxParameters.new
    assert_nil params.extra_filters
  end

  # ---------------------------------------------------------------------------
  # reference - one address carrying the query its schema request is made with
  # ---------------------------------------------------------------------------

  def test_reference_is_an_address
    params = Habarico::GalleryBoxParameters.new(reference: Habarico::ResourceReference.build('eshop/images'))
    assert_equal 'eshop', params.reference.service
    assert_equal 'images', params.reference.resource
  end

  def test_the_query_travels_inside_the_reference
    reference = Habarico::ResourceReference.build('images', params: { 'mode' => 'full' })
    params = Habarico::GalleryBoxParameters.new(reference: reference)
    assert_equal({ 'mode' => 'full' }, params.reference.params)
  end

  def test_no_schema_params_attribute_remains
    refute Habarico::GalleryBoxParameters.new.respond_to?(:schema_params)
  end

  # ---------------------------------------------------------------------------
  # filters
  # ---------------------------------------------------------------------------

  def test_filters_is_set
    filter = Habarico::FilterDescriptor.new(name: 'status')
    params = Habarico::GalleryBoxParameters.new(filters: [filter])
    assert_equal [filter], params.filters
  end

  def test_filters_defaults_to_nil
    params = Habarico::GalleryBoxParameters.new
    assert_nil params.filters
  end

  # ---------------------------------------------------------------------------
  # default_sorting
  # ---------------------------------------------------------------------------

  def test_default_sorting_is_set
    sort = Habarico::SortDescriptor.new(field_name: 'created_at', direction: 'asc')
    params = Habarico::GalleryBoxParameters.new(default_sorting: sort)
    assert_equal sort, params.default_sorting
  end

  def test_default_sorting_defaults_to_nil
    params = Habarico::GalleryBoxParameters.new
    assert_nil params.default_sorting
  end

end
