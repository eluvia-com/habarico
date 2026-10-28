module Habarico
  class ActionSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute
    include Habarico::ActiveModel::ExtensibleEnum

    # Type of the action.
    # `view` - opens a new view as redirect or dialog
    # `link` - opens an external link
    # `resource` - performs an action on the resource (like delete, update, etc.
    string_attr :type
    extensible_enum_attr :type, Types::ACTION_TYPE

    # Flag indicating if the action uses primary key or not
    boolean_attr :is_detail

    # Human-readable label for the action (button)
    string_attr :label

    # Icon contained in the action button
    string_attr :icon

    # Color of the action button. Uses standard MUI color types
    string_attr :color
    enum_attr :color, Types::COLOR_TYPE

    # Optional confirmation dialog before performing the action
    has_one_attr :confirm_dialog, 'Habarico::ConfirmDialogProperties'

    # Parameters specific to action type 'view'
    has_one_attr :view, 'Habarico::ViewActionParameters'

    # Parameters specific to action type 'resource'
    has_one_attr :resource, 'Habarico::ResourceActionParameters'

    # Parameters specific to action type 'link'
    has_one_attr :link, 'Habarico::LinkActionParameters'

    # Parameters specific to action type 'save'
    has_one_attr :save, 'Habarico::SaveActionParameters'

    # Parameters specific to action type 'upload-images'
    has_one_attr :upload_images, 'Habarico::UploadImagesActionParameters'
  end
end
