module Habarico
  class UploadFilesActionParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Resource where a record is created for each uploaded file. When set, uploads to this
    # resource instead of the current resource context.
    has_one_attr :reference, 'Habarico::ResourceReference'

    # Field name on the file model linking to the parent record.
    # When set together with reference, the current record's ID is used as the target value.
    string_attr :target

    # Array of accepted file extensions (e.g. [".pdf", ".docx"]).
    # When not set, the frontend uses its own default (.png,.jpg,.jpeg,.bmp,.gif), which accepts
    # images only - set it whenever the action uploads other files.
    any_attr :accept

    # Field name on the target model that holds the uploaded file. Required by the
    # frontend to know which attribute to set on the record it creates for each upload.
    string_attr :file_field

    # Additional data added to every file record the frontend creates for an upload
    any_attr :data

  end
end
