module Habarico
  class ActionReference
    include DefinitionModel

    attr_accessor :name, :label, :icon, :color, :action, :if, :permission, :menu_items, :view_mode, :dialog_width, :view_choices, :view_parameters, :view_keep_linked_parent,
                  :reference, :confirm_dialog_title, :confirm_dialog_message

    def initialize(params = {})
      @permission = case params[:name].to_s
                    when 'create' then :create
                    when 'edit' then :update
                    when 'delete' then :delete
                    else :read
                    end
      super(params)
    end

  end
end
