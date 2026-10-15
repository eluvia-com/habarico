module Habarico
  class CreateAction < ViewAction
    include DefinitionModel

    def initialize(params = {})
      @name = 'create'
      @icon = 'Add'
      @is_detail = false # -> not tied to a specific resource instance
      @show_in_detail = false # -> do not show in detail views
      @show_in_list = true # -> show in list views (on top of the list)
      @view_name = 'create' # -> connect it to the Habarico::CreateView or any other view named 'edit'
      @view_mode = :redirect # -> open the view on the new page
      @permission = :create
      super(params)
    end

  end
end
