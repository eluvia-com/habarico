module Habarico
  class ListBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'list'
    end
  end
end
