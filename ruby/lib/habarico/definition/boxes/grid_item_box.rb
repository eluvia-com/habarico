module Habarico
  class GridItemBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'grid-item'
    end
  end
end
