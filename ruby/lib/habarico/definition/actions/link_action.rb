module Habarico
  class LinkAction < Action
    include DefinitionModel

    def initialize(params = {})
      @type = :link
      super(params)
    end

  end
end
