module Habarico
  class TextMenuItem < MenuItem
    include DefinitionModel

    def initialize(params = {})
      @type = :text
      @priority = 1
      super(params)
    end

  end
end
