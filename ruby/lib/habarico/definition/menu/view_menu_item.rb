module Habarico
  class ViewMenuItem < MenuItem
    include DefinitionModel

    def initialize(params = {})
      @type = :view
      @view_mode = :redirect # -> open the view on the new page
      @priority = 1
      super(params)
    end

  end
end
