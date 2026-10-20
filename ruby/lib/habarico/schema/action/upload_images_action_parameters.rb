module Habarico
  class UploadImagesActionParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Resource where images will be created. When set, uploads to this resource
    # instead of the current resource context.
    string_attr :reference

    # Field name on the image model linking to the parent record.
    # When set together with reference, the current record's ID is used as the target value.
    string_attr :target

    # Array of accepted file extensions (e.g. [".png", ".jpg"]).
    # When not set, the frontend uses its own default (.png,.jpg,.jpeg,.bmp,.gif).
    any_attr :accept

    # Field name on the target model that holds the uploaded file. Required by the
    # frontend to know which attribute to set on the record it creates for each upload.
    string_attr :image_field

    # Additional data added to every image record the frontend creates for an upload
    any_attr :data

  end
end
