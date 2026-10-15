module Habarico
  class LinkMenuItem < MenuItem
    include DefinitionModel

    def initialize(params = {})
      @type = :link
      @priority = 1
      super(params)
    end

  end
end
