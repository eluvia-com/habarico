module Habarico
  class ShowAction < ViewAction
    include DefinitionModel

    def initialize(params = {})
      @name = 'show'
      @icon = 'Visibility'
      @is_detail = true # -> tied to a single resource item
      @show_in_detail = true # -> show in detail views (on top of the detail)
      @show_in_list = true # -> show in list views (for each item in the list)
      @view_name = 'show' # -> connect it to the Habarico::ShowView or any other view named 'show'
      @view_mode = :redirect # -> open the view on the new page
      @permission = :read
      super(params)
    end

  end
end
