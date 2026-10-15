module Habarico
  class MenuItem
    include DefinitionModel

    attr_accessor :name, :label, :type, :icon, :color, :priority, :view_name, :view_mode, :dialog_width, :view_keep_linked_parent, :link_url, :link_target,
                  :reference, :reference_action_name

  end
end
