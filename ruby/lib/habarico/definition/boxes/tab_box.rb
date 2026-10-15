module Habarico
  class TabBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'tab'
    end
  end
end
