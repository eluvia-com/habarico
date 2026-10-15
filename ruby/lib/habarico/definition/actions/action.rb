module Habarico
  class Action
    include DefinitionModel

    attr_accessor :type, :label, :icon, :color, :is_detail, :name, :show_in_detail, :show_in_list,
                  :confirm_dialog_title, :confirm_dialog_message, :permission
    attr_accessor :view_name, :view_mode, :dialog_width, :view_parameters, :view_keep_linked_parent # attributes for type = :view
    attr_accessor :endpoint_action_name, :endpoint_method, :endpoint_reference # attributes for type = :view or :resource
    attr_accessor :is_background, :data # attributes for type = :resource
    attr_accessor :link_url, :link_target, :if # attributes for type = :link
    attr_accessor :upload_images_reference, :upload_images_target, :upload_images_accept, :upload_images_image_field # attributes for type = :"upload-images"

  end
end
