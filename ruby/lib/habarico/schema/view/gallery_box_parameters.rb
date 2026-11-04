module Habarico
  class GalleryBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Address of the resource the gallery reads from, carrying the query its schema request is made with
    has_one_attr :reference, 'Habarico::ResourceReference'

    # Name of the field containing the image ({url, filename})
    string_attr :image_field

    # Human-readable label of the box
    string_attr :label

    # Name of the attribute in the referenced resource used as the coupling value
    string_attr :target

    # List of filters to be displayed / available to the gallery
    has_many_attr :filters, 'Habarico::FilterDescriptor'

    # Default sorting for the gallery
    has_one_attr :default_sorting, 'Habarico::SortDescriptor'

    # Additional filters to be applied to the gallery by default
    any_attr :extra_filters

  end
end
