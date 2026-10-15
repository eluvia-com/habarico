module Habarico
  class GridBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'grid'
    end
  end
end
