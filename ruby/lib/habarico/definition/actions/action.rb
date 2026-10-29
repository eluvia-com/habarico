module Habarico
  class Action
    include DefinitionModel

    attr_accessor :type, :label, :icon, :color, :is_detail, :name, :show_in_detail, :show_in_list,
                  :confirm_dialog_title, :confirm_dialog_message, :permission
    attr_accessor :view_name, :view_mode, :dialog_width, :view_parameters, :view_keep_linked_parent, :view_choices # attributes for type = :view
    # `endpoint_record_pk` pins the action to one concrete record instead of the one in the
    # context. It is what lets a trigger action point at a record of another resource - together
    # with `endpoint_reference` it spells out the whole target, so neither side has to be guessed
    # from the request the action ran on.
    attr_accessor :endpoint_action_name, :endpoint_method, :endpoint_reference, :endpoint_record_pk # attributes for type = :view or :resource
    attr_accessor :is_background, :data # attributes for type = :resource
    attr_accessor :after_save # attributes for type = :save
    attr_accessor :link_url, :link_target, :if # attributes for type = :link
    attr_accessor :upload_files_reference, :upload_files_target, :upload_files_accept, :upload_files_file_field, :upload_files_data # attributes for type = :"upload-files"

  end
end
