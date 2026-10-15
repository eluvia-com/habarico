module Habarico
  class View
    include DefinitionModel

    attr_accessor :type, :name, :label, :is_detail, :view_mode, :boxes, :filters, :toolbar_filters, :box, :endpoint_action_name,
                  :endpoint_method, :endpoint_reference, :model, :default_sorting, :row_actions, :toolbar_actions, :list_actions,
                  :single_click_action, :double_click_action, :permission

  end
end
