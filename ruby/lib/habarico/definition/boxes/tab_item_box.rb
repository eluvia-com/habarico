module Habarico
  class TabItemBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'tab-item'
    end
  end
end
