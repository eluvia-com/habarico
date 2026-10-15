module Habarico
  class DeleteAction < ResourceAction
    include DefinitionModel

    def initialize(params = {})
      @name = 'delete'
      @icon = 'Delete'
      @color = 'error'
      @is_detail = true # -> tied to a single resource item
      @show_in_detail = false # -> do not show in detail views
      @show_in_list = true # -> show in list views (for each item in the list)
      @endpoint_method = :delete # -> use HTTP DELETE method
      @confirm_dialog_title = I18n.t('confirmations.common.delete.title', default: nil)
      @confirm_dialog_message = I18n.t('confirmations.common.delete.message', default: nil)
      @permission = :delete
      super(params)
    end

  end
end
