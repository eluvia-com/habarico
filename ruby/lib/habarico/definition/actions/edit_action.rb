module Habarico
  class EditAction < ViewAction
    include DefinitionModel

    def initialize(params = {})
      @name = 'edit'
      @icon = 'Edit'
      @is_detail = true # -> tied to a single resource item
      @show_in_detail = true # -> show in detail views (on top of the detail)
      @show_in_list = true # -> show in list views (for each item in the list)
      @view_name = 'edit' # -> connect it to the Habarico::EditView or any other view named 'edit'
      @view_mode = :redirect # -> open the view on the new page
      @permission = :update
      super(params)
    end

  end
end
