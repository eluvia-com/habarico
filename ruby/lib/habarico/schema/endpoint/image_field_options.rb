module Habarico
  class ImageFieldOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Width to resize the image to (in pixels)
    integer_attr :resize_width

    # Aspect ratio to crop the image to (e.g. '16:9', '4:3')
    string_attr :crop_aspect_ratio

  end
end
