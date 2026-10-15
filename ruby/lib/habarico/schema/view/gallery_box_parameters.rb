module Habarico
  class GalleryBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Reference to another resource
    string_attr :reference

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

    # Additional parameters sent with the get schema request
    has_many_attr :schema_params, 'String', underlying_type: :hash

  end
end
