module Habarico
  class ViewAction < Action
    include DefinitionModel

    def initialize(params = {})
      @type = :view
      super(params)
    end

  end
end
